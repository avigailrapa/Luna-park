declare module 'bwip-js' {
  interface ToBufferOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
  }

  function toBuffer(options: ToBufferOptions): Promise<Buffer>;

  export default { toBuffer };
}
