;(function (undefined) {

  var up = this.Uploader = {};

  // Set the template for file upload items
  up.template = _.template(document.getElementById('upload-template').innerHTML);
  up.fileList = document.getElementById('file-uploads');

  // Setup event listeners
  up.setup = function () {
    document.querySelector('input[type=file]')
      .addEventListener('change', up.uploadFromFileField, false);
    this.fileList.addEventListener('drop', up.handleDrop, false); 
    this.fileList.addEventListener('click', up.removeUpload, false);
    this.fileList.addEventListener('dragover', function (ev) {
      ev.preventDefault();
    }, false); 
  };

  // Remove an upload from the list
  up.removeUpload = function (ev) {
    var li;

    if (ev.target.classList.contains('remove')) {
      li = ev.target.parentNode.parentNode;
      // TODO check if li has active upload and abort
      up.fileList.removeChild(li);
      ev.preventDefault();
    }
  },

  // Get the files dropped and send them to be uploaded
  up.handleDrop = function (ev) {
    // Stop browser attempting to open image in new window
    ev.stopPropagation();
    ev.preventDefault();

    up.uploadFileList(ev.dataTransfer.files); 
  };

  // Get the selected files from the file field and upload
  up.uploadFromFileField = function (ev) {
    up.uploadFileList(this.files);
  };

  // Upload each file in fileList
  up.uploadFileList = function (fileList) {
    var frag = document.createDocumentFragment();

    _.each(fileList, function (file) {
      var url = window.URL.createObjectURL(file)
        , li = document.createElement('li');

      li.innerHTML = up.template({
          name: file.name
        , size: file.size
        , dataURL: url
      });
      frag.appendChild(li);
    });

    this.fileList.appendChild(frag);
  };

  // Do it!
  up.setup();

}).call(this);
