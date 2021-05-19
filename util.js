import LZString from 'lz-string'

var intToHexLE = function (val, byteCount) {
  var hex = '';
  for (var i = 0; i < byteCount; i++) {
    hex += ('0' + ((val >> 8 * i) & 0xFF).toString(16)).substr(-2);
  }
  return hex;
};




function getRandomBitArray () {
  const dim = 40;
  const w = '#FFFFFF'
  const colors = ['#0000FF', '#FF0000', '#008000', '#FFFF00', '#800080', '#006400', '#808000',
    '#00FFFF', '#FF4500', '#4B0082', '#000080', '#D2691E', '#FF00FF', '#008080']
  let array = new Array(dim);

  for (let i = 0; i < dim; i++) {
    array[i] = new Array(dim)
  }

  let color = colors[Math.floor(Math.random() * 9)]
  for (let i = 0; i < dim; i = i + 4) {
    for (let j = 0; j < dim / 2; j = j + 4) {
      let r = Math.floor(Math.random() * 2)
      if (r === 1) {
        for (let n = 0; n < 4; n++) {
          for (let m = 0; m < 4; m++) {

            array[i + n][j + m] = '#FFFFFF';

          }
        }
      }
      else {
        for (let n = 0; n < 4; n++) {
          for (let m = 0; m < 4; m++) {

            array[i + n][j + m] = color;
          }
        }

      }
    }
  }
  for (let i = 0; i < dim; i++) {
    for (let j = 20; j < dim; j++) {
      array[i][j] = array[i][dim - j - 1];
    }
  }

  console.log('pixaaaa', array)
  return array;
}

export const RandomPixel2CompressedBitmap = function () {
  // file header
  var fileHeader = [
    '424D',     // Signature as bitmap
    '00000000', // File size
    '0000',     // Reserved1
    '0000',     // Reserved2
    '00000000'  // File Offset to PixelArray
  ];

  // info header
  var infoHeader = [
    '28000000', // Info header size
    '00000000', // Image Width
    '00000000', // Imate Height
    '0100',     // Planes
    '2000',     // Bits per pixel ('2000' -> 32bit color (no pallet))
    '00000000', // Compression
    '00000000', // Image Size
    '00000000', // X Pixels Per Meter
    '00000000', // Y Pixels Per Meter
    '00000000', // Colors in Color Table
    '00000000'  // Important color Count
  ];

  // image data
  var img = [];
  var colorArr = getRandomBitArray()
  var imgH = colorArr.length;
  var imgW;
  for (var y = imgH - 1; y >= 0; y--) { // draw from bottom to top
    imgW = colorArr[y].length;
    for (var x = 0; x < imgW; x++) {
      img.push(
        colorArr[y][x].substr(5, 2)
        + colorArr[y][x].substr(3, 2)
        + colorArr[y][x].substr(1, 2)
        + '00'
      );
    }
  }

  // update size info
  var headerSize = (fileHeader.join('') + infoHeader.join('')).length * 0.5;
  var imgSize = (img.join('')).length * 0.5;

  fileHeader[1] = intToHexLE(headerSize + imgSize, 4); // update file size
  fileHeader[4] = intToHexLE(headerSize, 4); // update header size

  infoHeader[1] = intToHexLE(imgW, 4); // update image width
  infoHeader[2] = intToHexLE(imgH, 4); // update image height
  infoHeader[6] = intToHexLE(imgSize, 4); // update image size

  // create bitmap image
  var data = fileHeader.join('') + infoHeader.join('') + img.join('');
  var bytes = new Uint8Array(data.length / 2); // Convert the string to bytes

  for (var i = 0; i < data.length; i += 2) {
    bytes[i / 2] = parseInt(data.substring(i, i + 2), 16);
  }

  console.log('bytes', bytes)
  let string = String.fromCharCode.apply(null, bytes);
  var compressed = LZString.compress(string);
  console.log('compressed', compressed.length, compressed);


  return compressed;
};

export const CompressedBitmap2URL = function (compressed) {
  var decompressed = LZString.decompress(compressed);
  var dearray = [];
  for (var i = 0; i < decompressed.length; i++) {
    dearray[i] = decompressed.charCodeAt(i);
  }
  console.log('decompressed', decompressed.length, decompressed);
  console.log('dearray', dearray.length, dearray);
  let bytes = new Int8Array(dearray)
  var blob = new Blob([bytes], { type: 'image/bmp' });

  console.log('blob', blob.arrayBuffer().then((data) => {
    let dataArray = new Int8Array(data);
    console.log('dataArray', dataArray)
  }))
  var image = new Image(40, 40);
  image.src = URL.createObjectURL(blob);
  return image.src
}

