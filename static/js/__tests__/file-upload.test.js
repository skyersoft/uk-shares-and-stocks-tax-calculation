
const FileUploadHandler = require('../file-upload');

document.body.innerHTML = `
  <div>
    <label id="uploadArea" for="fileInput"></label>
    <input type="file" id="fileInput" />
  </div>
`;

describe('FileUploadHandler', () => {
  let fileUploadHandler;

  beforeEach(() => {
    fileUploadHandler = new FileUploadHandler();
    fileUploadHandler.init('uploadArea', 'fileInput');
  });

  it('should initialize correctly', () => {
    expect(fileUploadHandler.uploadArea).toBeDefined();
    expect(fileUploadHandler.fileInput).toBeDefined();
  });

  it('should handle a valid file selection', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    fileUploadHandler.handleFile(file);
    expect(fileUploadHandler.getCurrentFile()).toBe(file);
  });

  it('should show an error for an invalid file type', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const showErrorSpy = jest.spyOn(fileUploadHandler, 'showError');
    fileUploadHandler.handleFile(file);
    expect(showErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'));
  });

  it('should clear the file selection', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    fileUploadHandler.handleFile(file);
    fileUploadHandler.clearFile();
    expect(fileUploadHandler.getCurrentFile()).toBeNull();
  });
});
