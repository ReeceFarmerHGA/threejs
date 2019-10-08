/* eslint indent: 0 */
/* eslint one-var: 0 */

import jQuery from 'jquery';
import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControls from 'three-orbitcontrols';

(function ($) {
    'use strict';
    var scene, camera, renderer, controls;

    // Enviroment
    var louvreSizeY = 15,
        louvreSizeZ = 2,
        doorSizeX = 200,
        doorSizeY = 300,
        doorSizeZ = 20,
        doorFrameVerticalSizeX = 20,
        doorFrameVerticalSizeY = doorSizeY,
        doorFrameVerticalSizeZ = doorSizeZ,
        doorFrameHorizontalSizeX = doorSizeX,
        doorFrameHorizontalSizeY = 30,
        doorFrameHorizontalSizeZ = doorSizeZ * 0.5;

    var stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    init();
    createDoors();
    animate();

    function init() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);

        // spotlights
        var spotLightFront = new THREE.SpotLight(0xffffff);
        spotLightFront.position.set(200, 200, 500);
        scene.add(spotLightFront);

        var spotLightBack = new THREE.SpotLight(0xffffff);
        spotLightBack.position.set(200, -200, -1000);
        scene.add(spotLightBack);

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 350;

        // Renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
    }

    function createDoors() {
        var group = new THREE.Group();

        var door = new THREE.Mesh(
                new THREE.BoxGeometry(doorSizeX, doorSizeY, doorSizeZ),
                new THREE.MeshLambertMaterial({
                    transparent: true,
                    opacity: 0
                })
            ),
            doorBox = new THREE.Box3().setFromObject(door);

        var horizontalFrame = new THREE.Mesh(
                new THREE.BoxGeometry(doorFrameHorizontalSizeX, doorFrameHorizontalSizeY, doorFrameHorizontalSizeZ),
                new THREE.MeshLambertMaterial({
                    color: 0xeeeeee
                })
            ),
            horizontalFrameBox = new THREE.Box3().setFromObject(horizontalFrame);

        var horizontalFramePositions = [{
                y: doorBox.getSize().y / 2 - horizontalFrameBox.getSize().y / 2,
            },
            {
                y: (doorBox.getSize().y / 2 - horizontalFrameBox.getSize().y / 2) * -1
            }
        ];

        for (var $frameInteger = 0; $frameInteger <= horizontalFramePositions.length - 1;) { // Loop through all the horizontal frame positions
            var key = Object.keys(horizontalFramePositions[$frameInteger]);
            var frame = horizontalFrame.clone();
            for (var $positionInteger = 0; $positionInteger <= key.length - 1;) { // loop through each position axis
                frame.position[key[$positionInteger]] = horizontalFramePositions[$frameInteger][key[$positionInteger]];
                group.add(frame);
                $positionInteger++;
            }
            $frameInteger++;
        }
        $frameInteger = null;
        $positionInteger = null;
        key = null;
        frame = null;

        var verticalFrame = new THREE.Mesh(
                new THREE.BoxGeometry(doorFrameVerticalSizeX, doorFrameVerticalSizeY, doorFrameVerticalSizeZ),
                new THREE.MeshLambertMaterial({
                    color: 0xeeeeee
                })
            ),
            verticalFrameBox = new THREE.Box3().setFromObject(verticalFrame);

        var verticalFramePositions = [{
                x: doorBox.getSize().x / 2 - verticalFrameBox.getSize().x / 2,
            },
            {
                x: (doorBox.getSize().x / 2 - verticalFrameBox.getSize().x / 2) * -1
            }
        ];

        for ($frameInteger = 0; $frameInteger <= verticalFramePositions.length - 1;) { // Loop through all the horizontal frame positions
            key = Object.keys(verticalFramePositions[$frameInteger]);
            frame = verticalFrame.clone();
            for ($positionInteger = 0; $positionInteger <= key.length - 1;) { // loop through each position axis
                frame.position[key[$positionInteger]] = verticalFramePositions[$frameInteger][key[$positionInteger]];
                group.add(frame);
                $positionInteger++;
            }
            $frameInteger++;
        }

        group.rotation.y = THREE.Math.degToRad(10);
        group.rotation.x = THREE.Math.degToRad(10);
        group.add(door);
        scene.add(group);
        createLouvres(group, doorBox);
    }

    function createLouvres(parent, target) {
        var louvreCount = (target.getSize().y - doorFrameHorizontalSizeY * 2) / louvreSizeY;

        var louvre = new THREE.Mesh(
            new THREE.BoxGeometry(target.getSize().x, louvreSizeY, louvreSizeZ),
            new THREE.MeshLambertMaterial({
                color: 0xeeeeee
            })
        );

        var i = 1;
        while (i <= louvreCount) {
            var newLouvre = louvre.clone();
            newLouvre.name = 'louvrename';
            newLouvre.position.y = ((target.getSize().y / 2) - (louvreSizeY / 2) - louvreSizeY * (i - 1)) - doorFrameHorizontalSizeY;
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
