export default class Helpers {
  static get cat(): string {
    return this.isWindows ? 'type' : 'cat'
  }

  static get echo(): string {
    return this.isWindows ? 'cmd' : 'echo'
  }

  static get echoArgs(): string[] {
    return this.isWindows ? ['/c', 'echo'] : []
  }

  static get fail(): string {
    return this.isWindows ? 'cmd' : 'false'
  }

  static get failArgs(): string[] {
    return this.isWindows ? ['/c', 'exit', '1'] : []
  }

  static get isLinux(): boolean {
    return Deno.build.os === 'linux'
  }

  static get isMac(): boolean {
    return Deno.build.os === 'darwin'
  }

  static get isWindows(): boolean {
    return Deno.build.os === 'windows'
  }

  static get sleep(): string {
    return this.isWindows ? 'timeout' : 'sleep'
  }

  static get spawnOptions(): { shell: boolean } {
    return { shell: this.isWindows }
  }

  static get success(): string {
    return this.isWindows ? 'cmd' : 'true'
  }

  static get successArgs(): string[] {
    return this.isWindows ? ['/c', 'exit', '0'] : []
  }

  static joinPath(base: string, ...segments: string[]): string {
    const separator = this.isWindows ? '\\' : '/'
    return segments.reduce((path, segment) => `${path}${separator}${segment}`, base)
  }

  static normalizeOutput(output: string): string {
    if (this.isWindows) {
      return output.replace(/\r\n/g, '\n').trim()
    }
    return output
  }

  static resolve(...segments: string[]): string {
    if (this.isWindows) {
      const joined = segments.join('\\')
      return joined.startsWith('C:') ? joined : `C:\\${joined.replace(/^\//, '')}`
    }
    return '/' + segments.join('/').replace(/^\//, '')
  }

  static sleepArgs(seconds: number): string[] {
    return this.isWindows ? [`/t`, `${seconds}`] : [`${seconds}`]
  }

  static async tempDir(): Promise<string> {
    return await Deno.makeTempDir()
  }

  static async workspace(name: string): Promise<string> {
    const base = await this.tempDir()
    const separator = this.isWindows ? '\\' : '/'
    const path = `${base}${separator}${name}`
    await Deno.mkdir(path, { recursive: true })
    return path
  }
}
