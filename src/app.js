// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { latLngToMeters } from '@googlemaps/three';

const sydney = { lat: -33.89738319314655, lng: 151.2128586324301 };
const sfs = { lat: -33.88910135052066, lng: 151.22536975190087 };
// const buildings = { lng: 151.2015685157926, lat: -33.89546287103286 };

const modelRef = { lat: -33.751039658046814, lng: 151.22886568754302 };

const apiOptions = {
  apiKey: API_KEY,
  version: 'beta',
  map_ids: ['ae2c12a12879ca1d'],
};

const mapOptions = {
  tilt: 60,
  heading: 0,
  zoom: 16.5,
  center: modelRef,
  mapId: 'ae2c12a12879ca1d',
};

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

async function initMap() {
  const mapDiv = document.getElementById('map');
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();
  const map = new google.maps.Map(mapDiv, mapOptions);

  const buttons = [
    [
      './images/rotate_left.svg',
      'rotate',
      20,
      google.maps.ControlPosition.RIGHT_CENTER,
    ],
    [
      './images/rotate_right.svg',
      'rotate',
      -20,
      google.maps.ControlPosition.LEFT_CENTER,
    ],
    [
      './images/arrow_downward.svg',
      'tilt',
      20,
      google.maps.ControlPosition.TOP_CENTER,
    ],
    [
      './images/arrow_upward.svg',
      'tilt',
      -20,
      google.maps.ControlPosition.BOTTOM_CENTER,
    ],
  ];

  const adjustMap = function (mode, amount) {
    switch (mode) {
      case 'tilt':
        map.setTilt(map.getTilt() + amount);
        break;
      case 'rotate':
        map.setHeading(map.getHeading() + amount);
        break;
      default:
        break;
    }
  };

  buttons.forEach(([image, mode, amount, position]) => {
    const controlDiv = document.createElement('div');
    const controlUI = document.createElement('input');
    controlUI.type = 'image';
    controlUI.width = 60;
    // controlUI.style.backgroundColor = '#ff0000';
    controlUI.src = image;
    controlUI.addEventListener('click', () => {
      adjustMap(mode, amount);
    });
    controlDiv.appendChild(controlUI);
    map.controls[position].push(controlDiv);
  });

  return map;
}

function initWebglOverlayView(map) {
  let scene, renderer, camera, loader;
  const webglOverlayView = new google.maps.WebglOverlayView();

  webglOverlayView.onAdd = () => {
    // set up the scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // soft white light
    scene.add(ambientLight);
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(0, 50000, 5000);
    // directionalLight.castShadow = true;

    // scene.add(directionalLight);

    // load the model
    loader = new GLTFLoader();
    // loader.load('giraffe-gltf-export_5560-15sep21_opaque.glb', (gltf) => {
    //   gltf.scene.scale.set(1, 1, 1);
    //   gltf.scene.rotation.x = (90 * Math.PI) / 180; // rotations are in radians
    //   scene.add(gltf.scene);
    // });
    loader.load('giraffe-gltf-export_5560-15sep21_translucent.glb', (gltf) => {
      console.log(gltf);

      gltf.scene.children.forEach((obj) => {
        if (obj.type === 'Mesh') {
          obj.material.opacity = 0.1;
        }
      });
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.rotation.x = (90 * Math.PI) / 180; // rotations are in radians
      scene.add(gltf.scene);
    });
  };

  webglOverlayView.onContextRestored = (gl) => {
    // create the three.js renderer, using the
    // maps's WebGL rendering context.
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      alpha: true,
      ...gl.getContextAttributes(),
    });
    console.log(renderer);
    renderer.autoClear = false;
  };

  webglOverlayView.onDraw = (gl, coordinateTransformer) => {
    console.log('onDraw');
    // update camera matrix to ensure the model is georeferenced correctly on the map
    const matrix = coordinateTransformer.fromLatLngAltitude(modelRef, 0);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    renderer.render(scene, camera);

    // always reset the GL state
    renderer.resetState();
  };
  webglOverlayView.setMap(map);
}

(async () => {
  const map = await initMap();
  initWebglOverlayView(map);
})();
