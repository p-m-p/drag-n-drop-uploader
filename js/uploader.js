// Uploader
// ---
//
// A HTML5 image uploader application which accepts files from a file input 
// field or files that are dropped directly onto the list of uploads in the UI.
;(function (undefined) {

  'use strict';

  // Create the main Uploader object with the default settings
  var up = this.Uploader = {
      // The template for the upload list items. The template is built with the
      // [templating functionality in lodash](http://lodash.com/docs#template)
      template: _.template(document.getElementById('upload-tmpl').innerHTML)
      // The list in the UI to which uploads will be added
    , fileList: document.getElementById('file-uploads')
      // The maximum number of concurrent active uploads
    , MAX_ACTIVE_UPLOADS: 5
      // A list for uploads that are waiting for a free slot to start running
    , queue: []
      // A list for the uploads that are actively uploading 
    , activeUploads: [] 
      // Internal tracker for the number of uploads that have been added
    , uploadCount: 0
  };

  // Sets up the initial state of the application. Bind event handlers for the
  // UI controls
  up.setup = function () {
    // Listen for changes on the file field and automatically upload any
    // selected files
    document
      .querySelector('input[type=file]')
      .addEventListener('change', up.uploadFromFileField, false);

    // Listen for any clicks on the file upload "remove" links
    this.fileList.addEventListener('click', up.removeUpload, false);

    // Handle the drag and drop for adding files directly to the upload list
    this.fileList.addEventListener('dragover', up.stopEvent, false); 
    this.fileList.addEventListener('drop', up.handleDrop, false); 
  };

  // Remove an upload from the list when it's "remove" link is clicked
  up.removeUpload = function (ev) {
    var li, activeUpload;

    // Make sure the event was triggered by clicking a remove link 
    if (ev.target.classList.contains('remove')) {
      // Fetch the list item for which the remove button was clicked
      li = ev.target.parentNode.parentNode;

      if (li) {
        // The upload may be active so attempt to remove it from the list of 
        // active uploads
        activeUpload = up.removeActiveUploadById(li.dataset.uploadId);

        // If it is an active upload abort the request and let the next queued
        // upload start
        if (activeUpload && activeUpload._xhr) {
          activeUpload._xhr.abort();
          up.nextUpload();
        }

        // Remove the list item from the upload list in the UI
        up.fileList.removeChild(li);
      }

      ev.preventDefault();
    }
  },

  // Get the files dropped on the upload list and send them to be uploaded
  up.handleDrop = function (ev) {
    up.stopEvent(ev);
    up.uploadFiles(up.filterImages(ev.dataTransfer.files)); 
  };

  // Get the selected files from the file field send them to be uploaded
  up.uploadFromFileField = function (ev) {
    up.uploadFiles(up.filterImages(this.files));
  };

  // Upload each file in fileList
  up.uploadFiles = function (fileList) {
    // Create a fragment to add the list items to as there may be many
    var frag = document.createDocumentFragment();

    _.each(fileList, function (file) {
      // Create a data URI to display a small thumbnail of the image being
      // uploaded
      var url = window.URL.createObjectURL(file)
        , li = document.createElement('li')
        , uploadId = (up.uploadCount += 1);

      // Create the list item using the lodash template
      li.innerHTML = up.template({
          name: file.name
        , size: file.size
        , dataURL: url
      });
      // Give the upload an id incase it needs to be fetched for cancellation
      li.dataset.uploadId = uploadId;
      // Add the list item to the fragment
      frag.appendChild(li);

      // Create an object with all of the upload details and send it to queued
      // for uploading
      up.queueUpload({
          id: uploadId
        , file: file
        , listItem: li
      });
    });

    // Append the files contained in the fragment to the file list in the UI
    this.fileList.appendChild(frag);
  };

  // Queue a file for uploading. If there is space in the list of active
  // uploads then it is added directly to the active uploads and started as
  // there is no need to wait
  up.queueUpload = function (upload) {
    // Check available upload slots
    if (up.activeUploads.length < up.MAX_ACTIVE_UPLOADS) {
      // Add to active uploads and start
      up.activeUploads.push(upload);
      up.startUpload(upload);
    }
    else {
      // Add to the upload to the bottom of queue stack
      up.queue.unshift(upload);
    }
  };

  // Starts a file upload and sets up all of the associated event handlers
  up.startUpload = function (upload) {
    var xhr = new XMLHttpRequest;

    // Add a reference to the Ajax request on the upload object
    upload._xhr = xhr;
    // And likewise add a reference to the upload object on the Ajax request
    // and it's associated request upload so that it is easy to update the UI
    // state in the event handlers
    xhr._file_upload = xhr.upload._file_upload = upload;
    // Open the request and set the event listeners
    xhr.open('POST', 'upload.php', true);
    xhr.setRequestHeader('X-FILE-NAME', upload.file.name);
    xhr.onload = up.uploadComplete;
    xhr.onerror = up.uploadError;
    xhr.upload.onprogress = up.updateProgressIndicator;

    // Send the File object as the Ajax request body
    xhr.send(upload.file);
  };

  // Event handler that runs when the file upload Ajax request has completed
  up.uploadComplete = function () {
    var li, nextUpload;

    // Request did not return with a 200
    if (this.status >= 400) {
      up.uploadError.call(this);
      return;
    }

    // Ensure that the file upload object set on the Ajax request referenced
    // using the this keyword exists
    if (this._file_upload) {
      // Get the UI list item so that it can be updated
      li = this._file_upload.listItem;
      // Ensure the progress bar is set to complete state
      li.querySelector('.progress').style.width = '100%';
      // Add complete class to the list item
      li.classList.add('complete');

      // Update the application state now that this upload has finished and 
      // set the next upload to start
      up.clearUpload(this);
    }
  };

  // Update the state of the UI if the upload fails
  up.uploadError = function (ev) {
    var li;

    // Ensure that the reference to the upload can be retrieved
    if (this._file_upload) {
      // Set the error state of the list item by adding the error class
      li = this._file_upload.listItem;
      li.classList.add('error');
    }

    // Clean up the application state
    up.clearUpload(this);
  };

  // Update the uploads progress indicator with the percentage of the upload
  // that has successfully uploaded
  up.updateProgressIndicator = function (ev) {
    var li, pctLoaded;

    // Ensure the progress can be obtained from the event object
    if (ev.lengthComputable && this._file_upload) {
      // Update the width of the progress bar in the list item to the 
      // percentage of the file that has uploaded
      li = this._file_upload.listItem;
      pctLoaded = ((ev.loaded / ev.total) * 100);
      li.querySelector('.progress').style.width = pctLoaded + '%';
    }
  };

  // Set the next upload to start, if it exists
  up.nextUpload = function () {
    var next = up.queue.pop();

    // If there is a queued upload
    if (next) {
      // Add it the list of active uploads and start it
      up.activeUploads.push(next);
      up.startUpload(next);
    }
  };

  // Remove and return the upload with the matching id from the list of
  // active uploads. If it does not exist undefined is returned
  up.removeActiveUploadById = function (uploadId) {
    var activeUpload;

    // Check each upload to see if it has a matching id
    _.each(up.activeUploads, function (upload) {
      // If the id matches then set the return variable and remove it from
      // the list of active uploads
      if (upload.id === +uploadId) {
        activeUpload = upload;
        up.activeUploads.splice(up.activeUploads.indexOf(upload), 1);
        // No further need to check any other active uploads
        return false;
      }
    });

    return activeUpload;
  };

  // Filter the file list and return an array of only the images
  up.filterImages = function (fileList) {
    // Set up a Regex to check the file types agaist
    var acceptedType = /^image\//;

    // Test each files type to ensure it is an image of some type
    return _.filter(fileList, function (file) {
      // If the test passes and it is an image add it to the filtered list
      return acceptedType.test(file.type);
    });
  };

  // Remove the active upload and kill any references
  up.clearUpload = function (xhr) {
    var upload = xhr._file_upload;

    // Ensure the reference to the file upload can be retrieved
    if (upload) {
      // Remove the active upload
      up.activeUploads.splice(up.activeUploads.indexOf(upload), 1);
      // Delete the reference on the upload to the Ajax request
      delete upload.xhr;
    }

    // Delete the reference to the file upload object on the Ajax request
    // and it's associated upload
    delete xhr._file_upload;
    delete xhr.upload._file_upload;

    // Start the next upload
    up.nextUpload();
  };

  // Stop the default action of an event and prevent it propagating
  up.stopEvent = function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
  };

  // Do it!
  up.setup();

}).call(this);
