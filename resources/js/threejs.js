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
// import * as Ammo from 'ammo.js';

(function () {
    'use strict';

    // Reusable vars
    var scene, camera, renderer, controls, stats, hemiLight, spotLightFront, tassle, louvreToggle1;
    var vector = new THREE.Vector3();

    // Animations
    var louvreArrayRotation, louvreArrayPosition, louvreArrayPositionNew, stringArray, toggleStrings;
    var rotateLouvres, positionLouvres, scaleStrings, toggleLouvreStrings;

    // Enviroment
    var louvreSizeY = 13,
        louvreSizeZ = 1,
        stringColor = 0xffffff,
        doorColor = 0xFEF2DD,
        louvreColour = 0x9ebdc6,
        doorSizeX = 300,
        doorSizeY = 300,
        doorSizeZ = 20;

    var options = {
        color: 0x9ebdc6,
        toggleLouvreRotation: false,
        toggleLouvrePosition: false,
        cameraHeight: 100,
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
            alpha: true,
            shadowMapEnabled: true,
            shadowMapType: THREE.PCFSoftShadowMap
        });
        renderer.shadowMap.enabled = true;
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

        var cube = new THREE.Mesh(
            new THREE.BoxGeometry(doorSizeX, doorSizeY, doorSizeZ),
            new THREE.MeshLambertMaterial({
                color: doorColor
            })
        );
        cube.position.z = 50;

        scene.traverse(function (mesh) {
            if (mesh.type === 'Mesh') {
                mesh.castShadow = true;
                mesh.recieveShadow = true;
            }
        });
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

        var floor_geometry = new THREE.PlaneGeometry(1000, 1000);
        var floor_material = new THREE.MeshPhongMaterial({
            color: 0xffffff
        });
        var floor = new THREE.Mesh(floor_geometry, floor_material);
        floor.position.set(0, -doorSizeY / 2 / 2, 0);
        floor.rotation.x -= Math.PI / 2;
        floor.receiveShadow = true;
        floor.castShadow = false;

        // scene.add(floor);
    }

    function createLights() {
        hemiLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1);
        hemiLight.position.set(-300, 300, 200);
        scene.add(hemiLight);

        // var hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
        // scene.add(hemiLightHelper);

        // spotlights
        spotLightFront = new THREE.SpotLight(0xffffff);
        spotLightFront.position.set(0, 400, 400);
        // scene.add(spotLightFront);
        // spotLightFront.castShadow = true;
        // spotLightFront.shadowCameraVisible = true;
        // spotLightFront.shadow.camera.near = 1;
        // spotLightFront.shadow.camera.far = 1000;
        // spotLightFront.shadow.radius = 1;

        // var spotLightHelper = new THREE.SpotLightHelper(spotLightFront, 10);
        // scene.add(spotLightHelper);
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
        shutters.add(options, 'cameraHeight').name('Camera height').onChange(function () {
            spotLightFront.position.y = options.cameraHeight;
            spotLightFront.rotation.x -= THREE.Math.degToRad(1);
        });
        shutters.add(options, 'toggleLouvreRotation').name('Toggle Rotation').onChange(function () {
            rotateLouvres.reverse();
            rotateLouvres.play();
            toggleLouvreStrings.reverse();
            toggleLouvreStrings.play();
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
                value: THREE.Math.degToRad(160),
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
                value: 2 * (louvreSizeZ * louvreArrayPositionNew.length),
                duration: 1000
            }],
            easing: 'easeInOutSine',
            autoplay: false
        });
        scaleStrings.reverse();

        toggleLouvreStrings = anime({
            targets: toggleStrings,
            y: [{
                value: (elm, index, t) => index === 0 ? elm.y / 2 : elm.y * 1.25,
                duration: 500
            }],
            easing: 'easeInOutSine',
            autoplay: false,
            update: function (anim) {
                // tassle.scale.y = 1 / louvreToggle1.scale.y;
                // tassle.position.y = -(louvreToggle1.scale.y * tassle.scale.y);
                // console.log(louvreToggle1.scale.y);
                // console.log(louvreToggle1.scale.y, tassle.scale.y);
                // tassle.position.y = louvreToggle1.scale.y * tassle.scale.y;
            }
        });
        toggleLouvreStrings.reverse();
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
            louvreAreaBox = new THREE.Box3().setFromObject(louvreArea);
        louvreArea.position.y = -blindTopperBox.getSize(vector).y / 2;

        var louvreString = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1),
            new THREE.MeshLambertMaterial({
                color: stringColor
            })
        );
        louvreString.scale.setY(louvreAreaBox.getSize(vector).y);
        louvreString.geometry.translate(0, -0.5, 0);
        var stringPositions = [{
            x: -75,
            y: 0,
            z: (doorSizeZ / 8)
        }, {
            x: -75,
            y: 0,
            z: -(doorSizeZ / 8)
        }, {
            x: 75,
            y: 0,
            z: (doorSizeZ / 8)
        }, {
            x: 75,
            y: 0,
            z: -(doorSizeZ / 8)
        }];
        stringArray = [];
        for (var stringInteger = 0; stringInteger + 1 <= stringPositions.length; stringInteger++) {
            var newString = louvreString.clone();
            newString.position.set(stringPositions[stringInteger].x, stringPositions[stringInteger].y, stringPositions[stringInteger].z);
            stringArray.push(newString.scale);
            blindTopper.add(newString);
        }

        var pullCordString = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1),
            new THREE.MeshLambertMaterial({
                color: stringColor
            })
        );
        pullCordString.geometry.translate(0, -0.5, 0);
        tassle = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 3, 10),
            new THREE.MeshLambertMaterial({
                color: doorColor
            })
        );

        louvreToggle1 = pullCordString.clone();
        louvreToggle1.scale.setY(louvreAreaBox.getSize(vector).y / 3);
        louvreToggle1.position.x = ((blindBox.getSize(vector).x / 2) - 30) * -1;
        louvreToggle1.position.z = (doorSizeZ / 2) - 2;
        tassle.scale.y = 1 / louvreToggle1.scale.y;
        tassle.geometry.translate(0, -louvreToggle1.scale.y, 0);
        louvreToggle1.add(tassle);
        var louvreToggle2 = louvreToggle1.clone();
        louvreToggle2.position.x = ((blindBox.getSize(vector).x / 2) - 40) * -1;

        blindTopper.add(louvreToggle1);
        // blindTopper.add(louvreToggle2);
        toggleStrings = [];
        toggleStrings.push(louvreToggle1.scale);
        toggleStrings.push(louvreToggle2.scale);

        singleBlind.add(blindTopper);
        createLouvres(singleBlind, louvreArea);
        scene.add(singleBlind);

        // Make sure the camera shows all
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
                color: louvreColour
            })
        );
        louvre.castShadow = true;
        louvre.receiveShadow = true;

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
