;(function (undefined) {

  var up = this.Uploader = {
      template: _.template(document.getElementById('upload-tmpl').innerHTML)
    , fileList: document.getElementById('file-uploads')
    , queue: []
    , activeUploads: [] 
    , uploadCount: 0
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
    var li, activeUpload;

    // Check if the event was triggered by clicking the remove button
    if (ev.target.classList.contains('remove')) {
      // Fetch the list item for which the remove button was clicked
      li = ev.target.parentNode.parentNode;
      up.fileList.removeChild(li);
      activeUpload = up.removeActiveUploadById(li.dataset.uploadId);

      // Abort the active upload
      if (activeUpload && activeUpload._xhr) {
        activeUpload._xhr.abort();
        up.nextUpload();
      }

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
        , li = document.createElement('li')
        , uploadId = (up.uploadCount += 1);

      li.innerHTML = up.template({
          name: file.name
        , size: file.size
        , dataURL: url
      });
      li.dataset.uploadId = uploadId;
      frag.appendChild(li);
      window.URL.revokeObjectURL(url);

      up.queueUpload({
          id: uploadId
        , file: file
        , listItem: li
      });
    });

    this.fileList.appendChild(frag);
  };

  up.queueUpload = function (upload) {
    if (up.activeUploads.length < 1) {
      up.activeUploads.push(upload);
      up.startUpload(upload);
    }
    else {
      up.queue.unshift(upload);
    }
  };

  up.startUpload = function (upload) {
    var xhr = new XMLHttpRequest;

    upload._xhr = xhr;
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
      up.activeUploads.push(next);
      up.startUpload(next);
    }
  }

  up.stopEvent = function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
  };

  up.removeActiveUploadById = function (uploadId) {
    var activeUpload;

    _.each(up.activeUploads, function (upload) {
      if (upload.id === +uploadId) {
        activeUpload = upload;
        up.activeUploads.splice(up.activeUploads.indexOf(upload), 1);
        return false;
      }
    });

    return activeUpload;
  };

  // Remove the active upload and kills any references
  up.clearUpload = function (xhr) {
    var upload = xhr._file_upload;

    if (upload) {
      up.activeUploads.splice(up.activeUploads.indexOf(upload), 1);
      delete upload.xhr;
    }

    delete xhr._file_upload;
    delete xhr.upload._file_upload;
  };

  // Do it!
  up.setup();

}).call(this);
