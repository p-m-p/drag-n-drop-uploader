describe('Uploader', function () {
  var uploadArea = document.getElementById('file-uploads');

  _.templateSettings = {
    interpolate: /(\{{2})(-|=)[^}]\1/
  };

  beforeEach(function () {});

  afterEach(function () {
    uploadArea.innerHTML = '';
  });

  it('should start image upload on drop', function () {
    var ev = document.createEvent('HTMLEvents')
      , file = new Blob([], {type: 'image/jpg'});

    // Set data transfer on event object
    file.name = 'image.jpg';
    ev.initEvent('drop', true, true);
    ev.dataTransfer = {files: [file]};

    spyOn(Uploader, 'startUpload').andCallFake(function () {}); 
    uploadArea.dispatchEvent(ev);

    expect(Uploader.startUpload).toHaveBeenCalled();
    expect(uploadArea.querySelectorAll('li').length).toEqual(1);
    expect(Uploader.activeUploads.length).toEqual(1);
    expect(Uploader.queue.length).toEqual(0);
  });
});
