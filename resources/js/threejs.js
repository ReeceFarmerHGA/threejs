/* eslint indent: 0 */
/* eslint one-var: 0 */
/* eslint space-before-function-paren: 0 */
/* global requestAnimationFrame */

import * as THREE from 'three';
import jQuery from 'jquery';
import Stats from 'stats.js';
import OrbitControls from 'three-orbitcontrols';
import Dat from 'dat.gui';
import anime from 'animejs/lib/anime.es.js';

(function () {
    'use strict';

    // Reusable vars
    var scene, camera, renderer, controls, stats, hemisphereLight, louvreCount, singleBlind;
    var vector = new THREE.Vector3();
    var stage = document.getElementById('threejs-stage');

    // Animations
    var louvresToRotate = [],
        louvresToPosition = [],
        louvresToPositionNewValues = [],
        stringArray = [],
        tasselsToAnimate = [],
        ropes = [],
        tasselAnimations = {};

    var rotateLouvres, positionLouvres, scaleStrings;

    // Enviroment
    var louvreSizeY = 3,
        louvreSizeZ = 0.5,
        stringColor = 0xffffff,
        doorColor = 0xFEF2DD,
        louvreColour = 0x9ebdc6,
        doorSizeX = document.getElementById('width').value,
        doorSizeY = document.getElementById('height').value,
        doorSizeZ = 8;

    var options = {
        color: louvreColour,
        toggleLouvreRotation: false,
        toggleLouvrePosition: false
    };

    init();
    animate();

    /**
     *  Initiate the scene
     **/
    function init() {
        // Scene
        scene = new THREE.Scene();

        // Lights
        createLights();

        // Camera
        createCameras();

        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            shadowMapEnabled: true,
            shadowMapType: THREE.PCFSoftShadowMap
        });
        renderer.shadowMap.enabled = true;
        renderer.setSize(stage.offsetWidth, stage.offsetHeight);
        stage.appendChild(renderer.domElement);

        // Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;

        // Stats
        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        // stage.appendChild(stats.dom);

        // Axis
        // var axesHelper = new THREE.AxesHelper(200);
        // scene.add(axesHelper);

        // Floor
        // createFloor();

        // Create blind
        createBlind();

        // Create gui
        createGui();

        window.addEventListener('load', onWindowResize, false);
        window.addEventListener('resize', onWindowResize, false);
    }

    /**
     *  Create the lights for the scene
     **/
    function createLights() {
        hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1);
        hemisphereLight.position.set(-300, 300, 200);
        scene.add(hemisphereLight);

        // var hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 10);
        // scene.add(hemisphereLightHelper);
    }

    /**
     *  Create the cameras for the scene
     **/
    function createCameras() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 9999);
        camera.position.z = 2000;
    }

    /**
     *  Create a floor
     **/
    function createFloor() {
        var texture = new THREE.TextureLoader().load('/images/grass.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);

        var floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            new THREE.MeshPhongMaterial({
                color: 0xffffff
            })
        );
        floor.position.set(0, -doorSizeY / 2 / 2, 0);
        floor.rotation.x -= Math.PI / 2;
        floor.receiveShadow = true;
        floor.castShadow = false;

        scene.add(floor);
    }

    /**
     *  Create GUI elements
     **/
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
            tasselAnimations['rotationCordUp'].reverse();
            tasselAnimations['rotationCordUp'].play();
            tasselAnimations['rotationCordDown'].reverse();
            tasselAnimations['rotationCordDown'].play();
        });
        shutters.add(options, 'toggleLouvrePosition').name('Toggle Louvres').onChange(function () {
            positionLouvres.reverse();
            positionLouvres.play();
            tasselAnimations['pullCordUp'].reverse();
            tasselAnimations['pullCordUp'].play();
            scaleStrings.reverse();
            scaleStrings.play();
        });
        shutters.open();
    }

    /**
     *  Create a blind
     **/
    function createBlind() {
        louvresToRotate = [];
        louvresToPosition = [];
        louvresToPositionNewValues = [];
        stringArray = [];
        tasselsToAnimate = [];
        ropes = [];
        tasselAnimations = {};
        scene.remove(singleBlind);
        singleBlind = new THREE.Group();

        var blind = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, doorSizeY, doorSizeZ),
                new THREE.MeshLambertMaterial({
                    color: doorColor
                })
            ),
            blindBox = new THREE.Box3().setFromObject(blind);

        var blindTopper = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, 6, doorSizeZ),
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
                wireframe: true,
                transparent: true,
                opacity: 0
            })
        );
        louvreArea.position.y = -blindTopperBox.getSize(vector).y / 2;

        createTassels(blindTopper);
        createLouvres(singleBlind, louvreArea);
        singleBlind.add(louvreArea);
        singleBlind.add(blindTopper);

        var louvreString = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1),
            new THREE.MeshLambertMaterial({
                color: stringColor
            })
        );
        louvreString.name = 'louvreString';
        louvreString.scale.setY((louvreSizeY * louvreCount) - louvreSizeY / 2);
        louvreString.geometry.translate(0, -0.5, 0);
        louvreString.position.y = -blindTopperBox.getSize(vector).y / 2;

        var stringGroup = new THREE.Group();
        var stringFront = louvreString.clone();
        var stringBack = louvreString.clone();
        stringFront.position.z = -((doorSizeZ / 2) * 0.20);
        stringBack.position.z = (doorSizeZ / 2) * 0.20;
        stringGroup.add(stringBack, stringFront);

        var leftmostString = stringGroup.clone();
        var rightmostString = stringGroup.clone();
        leftmostString.position.x = -(doorSizeX / 2) + 15;
        rightmostString.position.x = doorSizeX / 2 - 15;

        blindTopper.add(leftmostString, rightmostString);

        var stringCount = 1,
            stringGap = 999;
        while (stringGap > 30) {
            stringGap = (doorSizeX - 30) / stringCount;
            stringCount++;
        }
        for (var i = 0; i < stringCount; i++) {
            var newString = stringGroup.clone();
            blindTopper.add(newString);
            newString.position.x = (-(doorSizeX / 2) + 15) + stringGap * i;
        }

        scene.add(singleBlind);

        createAnimations();

        // Make sure the camera shows all
        camera.position.z = (Math.max(blindBox.getSize(vector).y, blindBox.getSize(vector).x) / 2 / Math.tan(Math.PI * 45 / 360)) + Math.max(doorSizeX / 2, doorSizeY / 2);
    }

    /**
     *  Create Tassel elements and respective cords
     **/
    function createTassels(target) {
        var tassel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.8, 2),
            new THREE.MeshLambertMaterial({
                color: doorColor
            })
        );
        var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1), new THREE.MeshBasicMaterial({
            color: 'white'
        }));
        rope.geometry.translate(0, 0.5, 0);

        var tasselPositions = [{
                x: -(doorSizeX / 2) + 8.5,
                y: -(doorSizeY / 2),
                z: doorSizeZ / 2 - 1,
                animateTo: -(doorSizeY / 3),
                animationName: 'rotationCordUp'
            }, {
                x: -(doorSizeX / 2) + 13.5,
                y: -(doorSizeY / 2),
                z: doorSizeZ / 2 - 1,
                animateTo: -((doorSizeY / 3) * 2),
                animationName: 'rotationCordDown'
            },
            {
                x: doorSizeX * 0.5 - 8,
                y: -(doorSizeY / 3),
                z: doorSizeZ * 0.5 - 1,
                animateTo: -(doorSizeY / 2),
                animationName: 'pullCordUp'
            }
        ];
        for (var i = 0; i < tasselPositions.length; i++) {
            var current = tasselPositions[i],
                newTassel = tassel.clone(),
                newRope = rope.clone();

            newTassel.position.set(current.x, current.y, current.z);
            newRope.scale.y = current.y * -1;

            ropes.push(newRope);
            newTassel.add(newRope);
            target.add(newTassel);

            tasselsToAnimate.push({
                tassel: newTassel,
                rope: newRope,
                endPosition: current.animateTo,
                animationName: current.animationName
            });
        }
    }

    /**
     *  Create the louvres
     * @param {String} the parent
     **/
    function createLouvres(parent, target) {
        var targetBox = new THREE.Box3().setFromObject(target); // Get the bounding box of the target
        var louvreAreaHeight = targetBox.getSize(vector).y;
        louvreCount = Math.floor(louvreAreaHeight / louvreSizeY); // Count how many louvres fit into the box

        var louvre = new THREE.Mesh(
            new THREE.BoxGeometry(targetBox.getSize(vector).x, louvreSizeY, louvreSizeZ),
            new THREE.MeshLambertMaterial({
                color: louvreColour
            })
        );
        louvre.name = 'louvre';
        louvre.rotation.x = THREE.Math.degToRad(90);

        for (var louvreIndex = 0; louvreIndex < louvreCount;) {
            var newLouvre = louvre.clone();
            newLouvre.position.y = ((louvreAreaHeight / 2) - (louvreSizeY / 2)) - louvreSizeY * louvreIndex;
            louvresToRotate.push(newLouvre.rotation);
            louvresToPosition.push(newLouvre.position);
            louvresToPositionNewValues.push(((louvreAreaHeight / 2) - (louvreSizeZ / 2)) - louvreSizeZ * louvreIndex);

            target.add(newLouvre);
            louvreIndex++;
        }
    }

    /**
     *  Create the animations
     **/
    function createAnimations() {
        rotateLouvres = anime({
            targets: louvresToRotate,
            x: THREE.Math.degToRad(160),
            duration: 500,
            easing: 'easeInOutSine',
            autoplay: false
        });
        rotateLouvres.reverse();

        positionLouvres = anime({
            targets: louvresToPosition,
            y: (el, i, l) => louvresToPositionNewValues[i],
            duration: 700,
            easing: 'easeInOutSine',
            autoplay: false
        });
        positionLouvres.reverse();

        scene.traverse(function (mesh) {
            if (mesh.name === 'louvreString') {
                stringArray.push(mesh.scale);
            }
        });
        scaleStrings = anime({
            targets: stringArray,
            y: (louvreSizeZ) * louvreCount,
            duration: 700,
            easing: 'easeInOutSine',
            autoplay: false
        });
        scaleStrings.reverse();

        tasselsToAnimate.forEach(function (tasselToAnimate, index) {
            var animation = anime({
                targets: tasselToAnimate.tassel.position,
                y: tasselToAnimate.endPosition,
                duration: 700,
                easing: 'easeInOutSine',
                autoplay: false,
                update: function (anim) {
                    tasselToAnimate.rope.scale.y = tasselToAnimate.tassel.position.y * -1;
                }
            });
            animation.reverse();
            tasselAnimations[tasselToAnimate.animationName] = animation;
        });
    }

    function onWindowResize() {
        camera.aspect = stage.offsetWidth / stage.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(stage.offsetWidth, stage.offsetHeight);
    }

    function animate() {
        // Render the scene
        renderer.render(scene, camera);

        // Realign the scene
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        // Update the controls
        controls.update();

        // Update the stats
        stats.update();

        // Restart the loop
        requestAnimationFrame(animate);

        var store = doorSizeX;
        if (document.getElementById('width').value !== store) {
            doorSizeX = document.getElementById('width').value;
            createBlind();
        }

        var store2 = doorSizeY;
        if (document.getElementById('height').value !== store2) {
            doorSizeY = document.getElementById('height').value;
            createBlind();
        }
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
