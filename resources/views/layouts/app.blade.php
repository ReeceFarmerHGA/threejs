<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>{{ config('app.name', 'threejs') }}</title>
    <link href="{{ mix('css/app.css') }}" rel="stylesheet" />
    <link rel="icon" type="image/png" href="{{ asset('images/ico.png') }}" />
    <script src="{{ mix('js/threejs.js') }}" defer></script>
</head>
<body>
    <div id="app">
        <header class="header">

        </header>
        <main>
            <div class="content">
                @yield('content')
            </div>
        </main>
    </div>
    @auth
        <script src="{{ mix('js/manifest.js') }}" defer></script>
        <script src="{{ mix('js/vendor.js') }}" defer></script>
        <script src="{{ mix('js/app.js') }}" defer></script>
    @endauth
</body>
</html>
