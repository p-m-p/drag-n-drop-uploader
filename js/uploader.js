;(function (undefined) {

  var up = this.Uploader = {
      template: _.template(document.getElementById('upload-tmpl').innerHTML)
    , fileList: document.getElementById('file-uploads')
    , queue: []
    , activeUploads: 0
  };

  // Setup event listeners
  up.setup = function () {
    document
      .querySelector('input[type=file]')
      .addEventListener('change', up.uploadFromFileField, false);

    this.fileList.addEventListener('click', up.removeUpload, false);
    this.fileList.addEventListener('dragover', up.stopEvent, false); 
    this.fileList.addEventListener('drop', up.handleDrop, false); 
  };

  // Remove an upload from the list
  up.removeUpload = function (ev) {
    var li;

    // Check if the event was triggered by clicking the remove button
    if (ev.target.classList.contains('remove')) {
      // Fetch the list item for which the remove button was clicked
      li = ev.target.parentNode.parentNode;
      // TODO check if li has active upload and abort
      up.fileList.removeChild(li);
      ev.preventDefault();
    }
  },

  // Get the files dropped and send them to be uploaded
  up.handleDrop = function (ev) {
    up.stopEvent(ev);
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
      window.URL.revokeObjectURL(url);

      up.queueUpload({
          file: file
        , listItem: li
      });
    });

    this.fileList.appendChild(frag);
  };

  up.queueUpload = function (upload) {
    if (up.activeUploads < 5) {
      up.activeUploads += 1;
      up.startUpload(upload);
    }
    else {
      up.queue.unshift(upload);
    }
  };

  up.startUpload = function (upload) {
    var xhr = new XMLHttpRequest;

    xhr._file_upload = xhr.upload._file_upload = upload;
    xhr.open('POST', 'upload.php', true);
    xhr.onload = up.uploadComplete;
    xhr.onerror = up.uploadError;
    xhr.upload.onprogress = up.updateProgressIndicator;

    xhr.send(upload.file);
  };

  up.uploadComplete = function () {
    var li, nextUpload;

    if (this._file_upload) {
      li = this._file_upload.listItem;
      // Ensure progress bar is set to complete state
      li.querySelector('.progress').style.width = '100%';
      // Add complete class
      li.classList.add('complete');
      up.clearUpload(this);
      up.activeUploads -= 1;

      up.nextUpload();
    }
  };

  up.uploadError = function (ev) {
    console.log('Error: ', ev);
    // TODO set error class on upload item
    up.clearUpload(this);
  };

  up.updateProgressIndicator = function (ev) {
    var li, pctLoaded;

    if (ev.lengthComputable && this._file_upload) {
      li = this._file_upload.listItem;
      pctLoaded = ((ev.loaded / ev.total) * 100);
      li.querySelector('.progress').style.width = pctLoaded + '%'
    }
  };

  up.nextUpload = function () {
    var next = up.queue.pop();

    if (next) {
      up.startUpload(next);
    }
  }

  up.stopEvent = function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
  };

  // Remove references to DOM node and File
  up.clearUpload = function (xhr) {
    delete xhr._file_upload;
    delete xhr.upload._file_upload;
  };

  // Do it!
  up.setup();

}).call(this);
