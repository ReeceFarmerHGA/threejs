/* eslint indent: 0 */
/* eslint one-var: 0 */
/* eslint space-before-function-paren: 0 */
/* global requestAnimationFrame */

import jQuery from 'jquery';
import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControls from 'three-orbitcontrols';
import Dat from 'dat.gui';
import 'three-dat.gui';

(function ($) {
    'use strict';

    var scene, camera, renderer, controls, stats, frame;
    var vector = new THREE.Vector3();
    var allDoorContainer = new THREE.Group();

    // Enviroment
    var layoutCode = 'LLR',
        louvreSizeY = 23,
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

    var options = {
        layoutCode: layoutCode,
        color: doorColor
    };

    init();
    readLayoutCode();
    animate();

    function init() {
        // Scene
        scene = new THREE.Scene();

        // Lights
        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1);
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

        // Axis
        var axesHelper = new THREE.AxesHelper(300);
        scene.add(axesHelper);


        // Gui
        var gui = new Dat.GUI();
        var shutters = gui.addFolder('Shutters');
        shutters.addColor(options, 'color').onChange(function () {
            scene.traverse(function (mesh) {
                if (mesh.name === 'frame' || mesh.name === 'louvre') {
                    mesh.material.color.setHex(dec2hex(options.color));
                }
            });
        });

        shutters.add(options, 'layoutCode').onChange(function () {
            layoutCode = options.layoutCode;
            readLayoutCode();
        });
        shutters.open();
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

    function readLayoutCode() {
        for (var i = allDoorContainer.children.length - 1; i >= 0; i--) {
            allDoorContainer.remove(allDoorContainer.children[i]);
        }
        for (var $stringIndex = 0; $stringIndex < layoutCode.length; $stringIndex++) {
            createDoor(layoutCode[$stringIndex], $stringIndex);
        }

        scene.add(allDoorContainer);
        allDoorContainer.position.x = 0;

        var allDoorContainerBox = new THREE.Box3().setFromObject(allDoorContainer);
        allDoorContainer.position.x = allDoorContainerBox.getCenter().x * -1;

        camera.position.z = (allDoorContainerBox.getSize(vector).x / 2 / Math.tan(Math.PI * 45 / 360)) + 200;
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

        // singleDoorContainer.add(door);
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
            frame = new THREE.Mesh(
                new THREE.BoxGeometry(frameOptions.size.x, frameOptions.size.y, frameOptions.size.z),
                new THREE.MeshLambertMaterial({
                    color: doorColor
                })
            );
            frame.name = 'frame';
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

        for (var $louvreIndex = 0; $louvreIndex <= louvreCount;) {
            var newLouvre = louvre.clone();
            newLouvre.name = 'louvre';
            newLouvre.position.y = ((target.getSize(vector).y / 2) - (louvreSizeY / 2) - louvreSizeY * ($louvreIndex - 1)) - doorFrameHorizontalSizeY;
            newLouvre.rotation.x = THREE.Math.degToRad(-50);
            parent.add(newLouvre);
            $louvreIndex++;
        }
    }

    function animate() {
        stats.begin();
        // scene.rotation.y += THREE.Math.degToRad(1);

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
        stats.end();
    }
})(jQuery);
