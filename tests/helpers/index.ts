export default class Helpers {
  static readonly isLinux = Deno.build.os === 'linux'
  static readonly isMac = Deno.build.os === 'darwin'
  static readonly isWindows = Deno.build.os === 'windows'

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

  static resolve(...segments: string[]): string {
    if (this.isWindows) {
      const joined = segments.join('\\')
      return joined.startsWith('C:') ? joined : `C:\\${joined.replace(/^\//, '')}`
    }
    return '/' + segments.join('/').replace(/^\//, '')
  }

  static get sleep(): string {
    return this.isWindows ? 'timeout' : 'sleep'
  }

  static sleepArgs(seconds: number): string[] {
    return this.isWindows ? [`/t`, `${seconds}`] : [`${seconds}`]
  }

  static get success(): string {
    return this.isWindows ? 'cmd' : 'true'
  }

  static get successArgs(): string[] {
    return this.isWindows ? ['/c', 'exit', '0'] : []
  }

  static async tempDir(): Promise<string> {
    return await Deno.makeTempDir()
  }

  static async workspace(name: string): Promise<string> {
    const base = await this.tempDir()
    const path = `${base}/${name}`
    await Deno.mkdir(path, { recursive: true })
    return path
  }
}
