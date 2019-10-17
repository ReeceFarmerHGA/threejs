/* eslint indent: 0 */
/* eslint one-var: 0 */
/* eslint space-before-function-paren: 0 */
/* global requestAnimationFrame */

import jQuery from 'jquery';
import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControls from 'three-orbitcontrols';
import Dat from 'dat.gui';
import anime from 'animejs/lib/anime.es.js';
import * as Ammo from 'ammo.js';

(function () {
    'use strict';

    // Reusable vars
    var scene, camera, renderer, controls, stats, hemiLight;
    var vector = new THREE.Vector3();

    // Animations
    var louvreArrayRotation, louvreArrayPosition, louvreArrayPositionNew, stringArray = [];
    var rotateLouvres, positionLouvres, scaleStrings;

    // Enviroment
    var louvreSizeY = 15,
        louvreSizeZ = 1,
        doorColor = 0xffffff,
        doorSizeX = 300,
        doorSizeY = 300,
        doorSizeZ = 20;

    var options = {
        color: doorColor,
        toggleLouvreRotation: false,
        toggleLouvrePosition: false
    };

    init();
    animate();

    function init() {
        // Scene
        scene = new THREE.Scene();

        // Floor
        createFloor();

        // Lights
        createLights();

        // Camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 9999);
        camera.position.z = 2000;

        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(renderer.domElement);

        // Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;

        // Stats
        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);

        // Axis
        // var axesHelper = new THREE.AxesHelper(200);
        // scene.add(axesHelper);

        // Create a blind
        createBlind();

        // Create tweens
        createAnimations();

        // Gui
        createGui();
    }

    function createFloor() {
        var geometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);

        var texture = new THREE.TextureLoader().load('/images/grass.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);

        var material = new THREE.MeshLambertMaterial({
            map: texture
        });

        var floor = new THREE.Mesh(geometry, material);
        floor.material.side = THREE.DoubleSide;
        floor.rotation.x = THREE.Math.degToRad(90);
        floor.position.y = -(doorSizeY / 2);

        // scene.add(floor);
    }

    function createLights() {
        hemiLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1);
        hemiLight.position.set(-300, 400, 200);
        scene.add(hemiLight);
        // var hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
        // scene.add(hemiLightHelper);
    }

    function createGui() {
        var gui = new Dat.GUI();
        var shutters = gui.addFolder('Shutters');
        shutters.addColor(options, 'color').onChange(function () {
            scene.traverse(function (mesh) {
                if (mesh.name === 'frame' || mesh.name === 'louvre') {
                    mesh.material.color.setHex(dec2hex(options.color));
                }
            });
        });
        shutters.add(options, 'toggleLouvreRotation').name('Toggle Rotation').onChange(function () {
            rotateLouvres.reverse();
            rotateLouvres.play();
        });
        shutters.add(options, 'toggleLouvrePosition').name('Toggle Louvres').onChange(function () {
            positionLouvres.reverse();
            positionLouvres.play();
            scaleStrings.reverse();
            scaleStrings.play();
        });
        shutters.open();
    }

    function createAnimations() {
        rotateLouvres = anime({
            targets: louvreArrayRotation,
            x: [{
                value: THREE.Math.degToRad(170),
                duration: 500
            }],
            easing: 'easeInCubic',
            autoplay: false
        });
        rotateLouvres.reverse();

        positionLouvres = anime({
            targets: louvreArrayPosition,
            y: [{
                value: (elm, index, t) => louvreArrayPositionNew[index],
                duration: 1000
            }],
            easing: 'easeInOutSine',
            autoplay: false
        });
        positionLouvres.reverse();

        scaleStrings = anime({
            targets: stringArray,
            y: [{
                value: 0.2,
                duration: 1000
            }],
            easing: 'easeInOutSine',
            autoplay: false
        });
        scaleStrings.reverse();
    }

    function createBlind() {
        var singleBlind = new THREE.Group();

        var blind = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, doorSizeY, doorSizeZ),
                new THREE.MeshLambertMaterial({
                    color: doorColor,
                    wireframe: true
                })
            ),
            blindBox = new THREE.Box3().setFromObject(blind);

        var blindTopper = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, 20, doorSizeZ),
                new THREE.MeshLambertMaterial({
                    color: doorColor
                })
            ),
            blindTopperBox = new THREE.Box3().setFromObject(blindTopper);
        blindTopper.position.y = doorSizeY / 2 - (blindTopperBox.getSize(vector).y / 2);

        var louvreArea = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, doorSizeY - blindTopperBox.getSize(vector).y, doorSizeZ),
                new THREE.MeshLambertMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0
                })
            ),
            louvreAreaBox = new THREE.Box3().setFromObject(blindTopper);
        louvreArea.position.y = -blindTopperBox.getSize(vector).y / 2;

        var louvreString = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, doorSizeY - blindTopperBox.getSize(vector).y - louvreSizeY),
            new THREE.MeshLambertMaterial({
                color: 0xffffff
            })
        );
        var stringPositions = [{
            x: -100,
            y: 0,
            z: (doorSizeZ / 8)
        }, {
            x: -100,
            y: 0,
            z: -(doorSizeZ / 8)
        }, {
            x: 100,
            y: 0,
            z: (doorSizeZ / 8)
        }, {
            x: 100,
            y: 0,
            z: -(doorSizeZ / 8)
        }];
        for (var stringInteger = 0; stringInteger + 1 <= stringPositions.length; stringInteger++) {
            var newString = louvreString.clone();
            newString.position.set(stringPositions[stringInteger].x, stringPositions[stringInteger].y, stringPositions[stringInteger].z);
            // stringArray.push({
            //     position: newString.position.y,
            //     scale: newString.scale.y
            // });
            stringArray.push(newString);
            singleBlind.add(newString);
        }

        singleBlind.add(blindTopper);
        createLouvres(singleBlind, louvreArea);
        scene.add(singleBlind);

        camera.position.z = (Math.max(blindBox.getSize(vector).y, blindBox.getSize(vector).x) / 2 / Math.tan(Math.PI * 45 / 360)) + 200;
    }

    function createLouvres(parent, target) {
        var targetBox = new THREE.Box3().setFromObject(target); // Get the bounding box of the target
        var louvreAreaHeight = targetBox.getSize(vector).y;
        var louvreCount = Math.floor(louvreAreaHeight / louvreSizeY); // Count how many louvres fit into the box

        var texture = new THREE.TextureLoader().load('/images/wood.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        var louvre = new THREE.Mesh(
            new THREE.BoxGeometry(targetBox.getSize(vector).x, louvreSizeY, louvreSizeZ),
            new THREE.MeshLambertMaterial({
                color: doorColor,
                map: texture
            })
        );
        louvre.name = 'louvre';
        louvre.rotation.x = THREE.Math.degToRad(90);

        louvreArrayRotation = []; // Collect the louvres for rotating later
        louvreArrayPosition = []; // Collect the louvres for positioning later
        louvreArrayPositionNew = []; // Collect the new position values
        for (var louvreIndex = 0; louvreIndex < louvreCount;) {
            var newLouvre = louvre.clone();
            newLouvre.position.y = ((louvreAreaHeight / 2 - louvreSizeY / 2) + target.position.y) - (louvreSizeY * louvreIndex);
            louvreArrayPositionNew.push(((louvreAreaHeight / 2 - louvreSizeZ / 2) + target.position.y) - (louvreSizeZ * louvreIndex));
            louvreArrayRotation.push(newLouvre.rotation);
            louvreArrayPosition.push(newLouvre.position);
            parent.add(newLouvre);
            louvreIndex++;
        }
    }

    function animate() {
        // Render the scene
        renderer.render(scene, camera);

        // Restart the loop
        requestAnimationFrame(animate);

        // Update the controls
        controls.update();

        // Update the stats
        stats.update();
    }

    function dec2hex(i) {
        var result = '0x000000';
        if (i >= 0 && i <= 15) {
            result = '0x00000' + i.toString(16);
        } else if (i >= 16 && i <= 255) {
            result = '0x0000' + i.toString(16);
        } else if (i >= 256 && i <= 4095) {
            result = '0x000' + i.toString(16);
        } else if (i >= 4096 && i <= 65535) {
            result = '0x00' + i.toString(16);
        } else if (i >= 65535 && i <= 1048575) {
            result = '0x0' + i.toString(16);
        } else if (i >= 1048575) {
            result = '0x' + i.toString(16);
        }
        if (result.length === 8) {
            return result;
        }
    }
})(jQuery);
