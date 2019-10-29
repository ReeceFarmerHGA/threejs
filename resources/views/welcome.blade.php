@extends('layouts.app')

@section('content')
    <aside class="">
        <form class="" action="index.html" method="post">
            <input id="width" type="range" name="" value="240" min="60" max="400">
            <input id="height" type="text" name="" value="80">
        </form>
    </aside>
    <div id="threejs-stage"></div>
@endsection
