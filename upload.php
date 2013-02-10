<?php

# Simple class for handling file uploads from the http input stream
class FileUploader {
  private $_upload_dir;

  # Set the upload directory
  public function __construct ($upload_to) {
    $this->_upload_dir = $upload_to;
  }

  # Read the file content and save it to the supplied file name in the upload
  # directory
  public function save_file ($filename) {
    if ($filename) {
      $file_path = $this->_upload_dir . '/' . basename($filename);
      $content = $this->read_stream();

      if ($content !== FALSE) {
        return file_put_contents($file_path, $this->read_stream());
      }
    }

    return FALSE;
  }

  # Reads the file content from the http input stream
  private function read_stream () {
    return file_get_contents('php://input');
  }
}

$uploader = new FileUploader('uploads');
$bytes_written = $uploader->save_file($_SERVER['HTTP_X_FILE_NAME']);

if ($bytes_written === FALSE) {
  header('HTTP/1.1 500 Internal Server Error');
  exit();
}

header('Content-Type: application/json');
echo json_encode($response);
