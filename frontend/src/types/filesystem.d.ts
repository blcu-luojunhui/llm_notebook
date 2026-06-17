interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite"
}

interface FileSystemDirectoryHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>
  [Symbol.asyncIterator](): AsyncIterableIterator<
    [string, FileSystemDirectoryHandle | FileSystemFileHandle]
  >
  values(): AsyncIterableIterator<
    FileSystemDirectoryHandle | FileSystemFileHandle
  >
}

interface Window {
  showDirectoryPicker(
    options?: FilePickerOptions
  ): Promise<FileSystemDirectoryHandle>
}

interface FilePickerOptions {
  id?: string
  mode?: "read" | "readwrite"
  startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos"
}
