<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="utf-8">
        <title>Three</title>
        <style media="screen">
            body {
                margin: 0px;
            }
            canvas,
            body,
            html {
                height: 100% !important;
                width: 100% !important;
            }
        </style>
    </head>
    <body>
        <script src="{{ asset('js/app.js') }}"></script>

        <script>
        var camera, scene, renderer;
        var geometry, material, mesh;

        init();
        animate();

        function init() {

            renderer = new THREE.WebGLRenderer( { antialias: true } );
            renderer.setSize( window.innerWidth, window.innerHeight );
            document.body.appendChild( renderer.domElement );

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 100;

            controls = new THREE.OrbitControls( camera );

            //controls.update() must be called after any manual changes to the camera's transform
            camera.position.set( 0.8, 0, 0 );
            controls.update();

            geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            material = new THREE.MeshNormalMaterial();

            group = new THREE.Group(); //create an empty container


            directions = ['x', 'y', 'z'];
            for (i = 0; i <= 2; i++) {
                for (var key in directions) {
                    var direction = directions[key];
                    var spacing = 0.15;
                    thisMesh = new THREE.Mesh( geometry, material );
                    thisMesh.position[direction] = spacing * i;
                    group.add(thisMesh);

                    thisMeshInvert = new THREE.Mesh( geometry, material );
                    thisMeshInvert.position[direction] = (spacing * i) - ((spacing * i) * 2);
                    group.add(thisMeshInvert);
                }
            }

            scene.add( group );

        }

        function animate() {
            requestAnimationFrame( animate );
            //
            // group.rotation.x += 0.05;
            // group.rotation.y += 0.05;

            controls.update();


            renderer.render( scene, camera );
        }


        </script>
    </body>
</html>
