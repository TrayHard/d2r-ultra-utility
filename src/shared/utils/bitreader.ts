export class BitReader {
  public littleEndian = true;
  public bits: Uint8Array;
  public offset = 0;

  public static fromBuffer(buffer: Buffer): BitReader {
    const view = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    const copy = view.slice();
    return new BitReader(copy.buffer);
  }

  constructor(arrBuffer: ArrayBuffer) {
    const typedArray = new Uint8Array(arrBuffer);
    this.bits = new Uint8Array(typedArray.length * 8);
    typedArray.reduce((acc: number, c: number) => {
      const b = c
        .toString(2)
        .padStart(8, "0")
        .split("")
        .reverse()
        .map((e) => parseInt(e, 2));
      b.forEach((bit) => (this.bits[acc++] = bit));
      return acc;
    }, 0);
  }

  public ReadBit(): number {
    if (this.offset >= this.bits.length) {
      throw new Error("Trying to read past the end of the bits");
    }
    const bit = this.bits[this.offset]!;
    this.offset += 1;
    return bit;
  }

  public ReadBitArray(count: number): Uint8Array {
    const bits = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const bit = this.ReadBit();
      bits[i] = bit;
    }
    return bits;
  }

  public ReadBits(bytes: Uint8Array, count: number): Uint8Array {
    if (this.offset + count > this.bits.length) {
      throw new Error("Trying to read past the end of the bits");
    }
    let byteIndex = 0;
    let bitIndex = 0;
    for (let i = 0; i < count; i++) {
      const hasBit = (this.bits[this.offset + i] ?? 0) !== 0;
      if (hasBit) {
        const mask = (1 << bitIndex) & 0xff;
        const prev = bytes.at(byteIndex) ?? 0;
        bytes[byteIndex] = prev | mask;
      }
      bitIndex++;
      if (bitIndex === 8) {
        byteIndex++;
        bitIndex = 0;
      }
    }
    this.offset += count;
    return bytes;
  }

  public ReadBytes(bytes: number): Uint8Array {
    return this.ReadBits(new Uint8Array(bytes), bytes * 8);
  }

  public ReadArray(bytes: number): Uint8Array {
    return this.ReadBytes(bytes);
  }

  public ReadByte(bits = 8): number {
    const dataview = new DataView(
      this.ReadBits(new Uint8Array(1), bits).buffer
    );
    return dataview.getUint8(0);
  }

  public ReadUInt8(bits = 8): number {
    return this.ReadByte(bits);
  }

  public ReadUInt16(bits: number = 8 * 2): number {
    const dataview = new DataView(
      this.ReadBits(new Uint8Array(2), bits).buffer
    );
    return dataview.getUint16(0, this.littleEndian);
  }

  public ReadUInt32(bits: number = 8 * 4): number {
    const dataview = new DataView(
      this.ReadBits(new Uint8Array(4), bits).buffer
    );
    return dataview.getUint32(0, this.littleEndian);
  }

  public ReadString(bytes: number): string {
    const buffer = this.ReadBytes(bytes).buffer;
    return new TextDecoder().decode(buffer);
  }

  public ReadNullTerminatedString(): string {
    const start = this.offset;
    while (this.ReadByte()) { }
    const end = this.offset - 8;
    const buffer = this.SeekBit(start).ReadBytes((end - start) / 8);
    this.SeekBit(end + 8);
    return new TextDecoder().decode(buffer);
  }

  public SkipBits(number: number): BitReader {
    this.offset += number;
    return this;
  }

  public SkipBytes(number: number): BitReader {
    return this.SkipBits(number * 8);
  }

  public SeekBit(offset: number): BitReader {
    this.offset = offset;
    return this;
  }

  public SeekByte(offset: number): BitReader {
    return this.SeekBit(offset * 8);
  }

  public Align(): BitReader {
    this.offset = (this.offset + 7) & ~7;
    return this;
  }
}
