/* eslint indent: 0 */
/* eslint one-var: 0 */
/* eslint space-before-function-paren: 0 */

import jQuery from 'jquery';
import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControls from 'three-orbitcontrols';

(function ($) {
    'use strict';

    var scene, camera, renderer, controls, stats;
    var vector = new THREE.Vector3();
    var allDoorContainer = new THREE.Group();

    // Enviroment
    var layoutCode = 'LLRLLR',
        louvreSizeY = 15,
        louvreSizeZ = 2,
        doorColor = 0xffffff,
        doorSizeX = 200,
        doorSizeY = 500,
        doorSizeZ = 20,
        doorFrameVerticalSizeX = 20,
        doorFrameVerticalSizeY = doorSizeY,
        doorFrameVerticalSizeZ = doorSizeZ,
        doorFrameHorizontalSizeX = doorSizeX,
        doorFrameHorizontalSizeY = 30,
        doorFrameHorizontalSizeZ = doorSizeZ * 0.5;

    init();
    readLayoutCode();
    animate();

    function init() {
        // Scene
        scene = new THREE.Scene();

        // lights
        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
        hemiLight.color.setHSL(0, 1, 1);
        hemiLight.groundColor.setHSL(0, 0, 0.3);
        hemiLight.position.set(-300, 400, 200);
        scene.add(hemiLight);
        // var hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
        // scene.add(hemiLightHelper);

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

        // gui
        var gui = new dat.GUI();

    }

    function readLayoutCode() {
        for (var $stringIndex = 0; $stringIndex < layoutCode.length; $stringIndex++) {
            createDoor(layoutCode[$stringIndex], $stringIndex);
        }
        var allDoorContainerBox = new THREE.Box3().setFromObject(allDoorContainer);
        allDoorContainerBox.getCenter(allDoorContainer.position).multiplyScalar(-1);

        scene.add(allDoorContainer);
        camera.position.z = allDoorContainerBox.getSize(vector).x / 2 / Math.tan(Math.PI * 45 / 360);
    }

    function createDoor(type, index) {
        var singleDoorContainer = new THREE.Group();

        var door = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, doorSizeY, doorSizeZ),
                new THREE.MeshLambertMaterial({
                    // transparent: true,
                    color: 0x00ff00,
                    wireframe: true
                    // opacity: 0
                })
            ),
            doorBox = new THREE.Box3().setFromObject(door);

        singleDoorContainer.add(door);
        singleDoorContainer.position.x = doorBox.getSize(vector).x * index;
        allDoorContainer.add(singleDoorContainer);

        createFrames(singleDoorContainer, doorBox);
        createLouvres(singleDoorContainer, doorBox);
    }

    function createFrames(parent, target) {
        var frames = [{
            name: 'top',
            color: doorColor,
            size: {
                x: doorFrameHorizontalSizeX,
                y: doorFrameHorizontalSizeY,
                z: doorFrameHorizontalSizeZ
            },
            position: {
                x: 0,
                y: target.getSize(vector).y / 2 - doorFrameHorizontalSizeY / 2,
                z: 0
            }
        }, {
            name: 'bottom',
            color: doorColor,
            size: {
                x: doorFrameHorizontalSizeX,
                y: doorFrameHorizontalSizeY,
                z: doorFrameHorizontalSizeZ
            },
            position: {
                x: 0,
                y: (target.getSize(vector).y / 2 - doorFrameHorizontalSizeY / 2) * -1,
                z: 0
            }
        }, {
            name: 'left',
            color: doorColor,
            size: {
                x: doorFrameVerticalSizeX,
                y: doorFrameVerticalSizeY,
                z: doorFrameVerticalSizeZ
            },
            position: {
                x: (target.getSize(vector).x / 2 - doorFrameVerticalSizeX / 2) * -1,
                y: 0,
                z: 0
            }
        }, {
            name: 'right',
            color: doorColor,
            size: {
                x: doorFrameVerticalSizeX,
                y: doorFrameVerticalSizeY,
                z: doorFrameVerticalSizeZ
            },
            position: {
                x: target.getSize(vector).x / 2 - doorFrameVerticalSizeX / 2,
                y: 0,
                z: 0
            }
        }];

        for (var $frameIndex = 0; $frameIndex <= frames.length - 1;) {
            var frameOptions = frames[$frameIndex];
            var frame = new THREE.Mesh(
                new THREE.BoxGeometry(frameOptions.size.x, frameOptions.size.y, frameOptions.size.z),
                new THREE.MeshLambertMaterial({
                    color: frameOptions.color
                })
            );
            frame.position.x = frameOptions.position.x;
            frame.position.y = frameOptions.position.y;
            frame.position.z = frameOptions.position.z;
            parent.add(frame);
            $frameIndex++;
        };
    }

    function createLouvres(parent, target) {
        var louvreCount = (target.getSize(vector).y - doorFrameHorizontalSizeY * 2) / louvreSizeY;

        var louvre = new THREE.Mesh(
            new THREE.BoxGeometry(target.getSize(vector).x, louvreSizeY, louvreSizeZ),
            new THREE.MeshLambertMaterial({
                color: doorColor
            })
        );

        var i = 1;
        while (i <= louvreCount) {
            var newLouvre = louvre.clone();
            newLouvre.name = 'louvrename';
            newLouvre.position.y = ((target.getSize(vector).y / 2) - (louvreSizeY / 2) - louvreSizeY * (i - 1)) - doorFrameHorizontalSizeY;
            parent.add(newLouvre);
            i++;
        }
    }

    function animate() {
        stats.begin();
        // group.rotation.y += speed;
        scene.traverse(function (louvre) {
            if (louvre.name === 'louvrename') {
                louvre.rotation.x += THREE.Math.degToRad(1);
            }
        });
        stats.end();

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
    }

})(jQuery);
