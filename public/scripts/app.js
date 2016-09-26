$(document).ready(function () {


  /**
   * Gallery module. Contain some public methods such as rendering and adding image to server
   * @type {Object}
   */
  var gallery = (function () {
    var canvas = $('#canvas');
    var galleryList = $('.gallery__list');
    var loader = $('.loader');
    var tmpl = $('#_gallery__item').html();


    /**
     * @description
     * {Public} - Perform adding cropped image to the gallery list. If second param is provided method will return only
     * compiled DOM element.
     * @param link {String} - username
     * @param isLoad {String} - password
     * @returns {String} - gallery item template.
     */
    function addImageToGallery(link, isLoad) {
      var dataObject = {
        image: {
          'link': link,
          'name': utils.parseImageName(link)
        }
      };
      var parsedTmpl = _.template(tmpl)(dataObject);
      if (!isLoad) {
        $(galleryList).append(parsedTmpl);
      } else {
        return parsedTmpl;
      }
    }


    /**
     * @description
     * {Public} - Perform gallery rendering on load
     * @param images {String} - username
     */
    function renderGallery(images) {
      var container = $('<div>');
      images.forEach(function (item) {
        var galleryItem = addImageToGallery(item, 'load');
        $(container).append(galleryItem);
      });
      $(loader).addClass('hidden');
      $(galleryList).append($(container).html());
    }

    return {
      renderGallery: renderGallery,
      addImageToGallery: addImageToGallery
    };
  })();


  /**
   * App module. Contain main logic of application and public init method (on loading)
   * @type {Object}
   */
  var app = (function () {
    var ENDPOINT_URL = '/jsapiupload';
    var filesInput = $('.controls__upload');
    var canvas = $('#canvas');
    var downloadBtn = $('.controls__download');
    var cropBtn = $('.controls__crop');
    var loader = $('.loader');


    /**
     * @description
     * {Private} - Handler for files input. It reads uploaded image and then call crop image method.
     * It also enable crop button by adding for it event listener.
     * @param e {Object} - event object
     */
    function handleImage(e) {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        var img = e.target.files[0];
        var imgElement = $('<img>');
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
          $(imgElement).attr('src', e.target.result);
          $(downloadBtn).attr('download', img.name);
          drawImage(imgElement[0]);
        };
        fileReader.readAsDataURL(img);
        $(cropBtn).removeClass('disabled');
        $(cropBtn).on('click', cropImage);
      } else {
        //handle UI error message
      }
    }


    /**
     * @description
     * {Private} - It renders uploaded image on canvas and add event listener for 'Jcrop coords' picker
     * @param img {Object} - uploaded image
     */
    function drawImage(img) {
      var w = img.width;
      var h = img.height;
      var canvasWidth = canvas.get(0).width;
      var canvasHeight = canvas.get(0).height;
      var context = canvas.get(0).getContext('2d');
      var imgDataBase64;
      if (w < h) {
        canvas.get(0).width = canvasHeight;
        context.drawImage(img, 0, 0, canvasHeight, canvasHeight);
      } else {
        context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      }
      imgDataBase64 = canvas.get(0).toDataURL();
      $(downloadBtn).attr('href', imgDataBase64);
      $(canvas).Jcrop({
        onChange: addCoords
      });
    }


    /**
     * @description
     * {Private} - Crops image and then upload selected area to the node server
     * @param e {Object} - event object
     */
    function cropImage(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var newCanvas = $('<canvas>');
      var context = newCanvas.get(0).getContext('2d');
      var imageObj = new Image();
      var imgDataBase64;
      var coords = {
        x1: $(e.target).attr('data-x1'),
        x2: $(e.target).attr('data-x2'),
        y1: $(e.target).attr('data-y1'),
        y2: $(e.target).attr('data-y2'),
        w: $(e.target).attr('data-w'),
        h: $(e.target).attr('data-h')
      };

      imageObj.src = $(downloadBtn).attr('href');
      newCanvas.get(0).width = canvas.get(0).width;
      newCanvas.get(0).height = canvas.get(0).height;
      context.drawImage(imageObj, coords.x1, coords.y1, coords.w, coords.h, 0, 0, canvas.get(0).width, canvas.get(0).height);
      imgDataBase64 = newCanvas.get(0).toDataURL();
      uploadImage(imgDataBase64);
    }


    /**
     * @description
     * {Private} - Helper function that may needed in some cases to clear canvas. Possible additions is to provide
     * canvas element as a parameter.
     */
    function clearCanvas() {
      var context = canvas.get(0).getContext('2d');
      var canvasWidth = canvas.get(0).width;
      var canvasHeight = canvas.get(0).height;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
    }


    /**
     * @description
     * {Private} - It gets coordinates of selected area and then provide saving to the related data-attributes
     * @param c {Object} - coordinates
     */
    function addCoords(c) {
      $(cropBtn)
        .attr('data-x1', c.x)
        .attr('data-x2', c.x2)
        .attr('data-y1', c.y)
        .attr('data-y2', c.y2).attr('data-w', c.w).attr('data-h', c.h);
    }


    /**
     * @description
     * {Public} - app.init method. On load it gets listing of all cropped images and calls renderGallery.
     */
    function getSavedImages() {
      $.ajax({
        url: ENDPOINT_URL,
        type: 'GET'
      }).done(function (response) {
        gallery.renderGallery(response.images);
      }).fail(function (err) {
        console.log(err);
      });
    }


    /**
     * @description
     * {Private} - Upload image to the server. If success - re-render gallery with addImageToGallery method.
     * @param img {String} - base64data
     */
    function uploadImage(img) {
      $.ajax({
        url: ENDPOINT_URL,
        type: 'POST',
        data: {
          'image': img
        }
      }).done(function (response) {
        gallery.addImageToGallery(response.link);
      }).fail(function (err) {
        console.log(err);
      });
    }

    $(filesInput).on('change', handleImage);

    return {
      init: getSavedImages
    };
  })();


  /**
   * Utils module. Might contain some public methods such as parsers
   * @type {Object}
   */
  var utils = (function(){


    /**
     * @description
     * {Public} - It parses image name from the link and return only name. It is possible to add here desirable name
     * generator.
     * @param link {String} - link to the image
     * @returns {String} - image name
     */
    function parseImageName(link) {
      var arr = link.split('/');
      var lastIndex = arr.length - 1;
      return arr[lastIndex];
    }

    return {
      parseImageName: parseImageName
    };
  })();

  app.init();
});
