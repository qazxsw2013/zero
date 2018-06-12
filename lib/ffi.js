'use strict';

({ binding, load, process }) => {
  const ffi = binding('ffi');
  Object.setPrototypeOf(ffi.types, null);

  const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

  ffi.types.void.wrap = () => {};
  ffi.types.void.unwrap = () => undefined;

  ffi.types.uint8.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.uint8);
    new DataView(a.buffer).setUint8(0, value);
    return a;
  };
  ffi.types.uint8.unwrap = (a) =>
    new DataView(a.buffer).getUint8(0);

  ffi.types.int8.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.int8);
    new DataView(a.buffer).setInt8(0, value);
    return a;
  };
  ffi.types.int8.unwrap = (a) =>
    new DataView(a.buffer).getInt8(0);

  ffi.types.uint16.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.uint16);
    new DataView(a.buffer).writeUint16(0, value);
    return a;
  };
  ffi.types.uint16.unwrap = (a) =>
    new DataView(a.buffer).getUint16(0);

  ffi.types.int16.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.int16);
    new DataView(a.buffer).writeInt16(0, value);
    return a;
  };
  ffi.types.int16.unwrap = (a) =>
    new DataView(a.buffer).getInt16(0);

  ffi.types.uint32.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.uint);
    new DataView(a.buffer).setUint32(0, value);
    return a;
  };
  ffi.types.uint32.unwrap = (a) =>
    new DataView(a.buffer).getUint32(0);

  ffi.types.int32.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.int);
    new DataView(a.buffer).setInt32(0, value);
    return a;
  };
  ffi.types.int32.unwrap = (a) =>
    new DataView(a.buffer).getInt32(0);

  ffi.types.uchar.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.uchar);
    new DataView(a.buffer).setUint8(0, value);
    return a;
  };
  ffi.types.uchar.unwrap = (a) =>
    new DataView(a.buffer).getUint8(0);

  ffi.types.char.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.char);
    new DataView(a.buffer).setInt8(0, value);
    return a;
  };
  ffi.types.char.unwrap = (a) =>
    new Uint8Array(a.buffer).getInt8(0);

  ffi.types.ushort.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.ushort);
    new DataView(a.buffer).setUint16(0, value);
    return a;
  };
  ffi.types.ushort.unwrap = (a) =>
    new DataView(a.buffer).getUint16(0);

  ffi.types.short.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.short);
    new DataView(a.buffer).setInt16(0, value);
    return a;
  };
  ffi.types.short.unwrap = (a) =>
    new DataView(a.buffer).getInt16(0);

  ffi.types.uint.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.uint);
    new DataView(a.buffer).setUint32(0, value);
    return a;
  };
  ffi.types.uint.unwrap = (a) =>
    new DataView(a.buffer).getUint32(0);

  ffi.types.int.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.int);
    new DataView(a.buffer).setInt32(0, value);
    return a;
  };
  ffi.types.int.unwrap = (a) =>
    new DataView(a.buffer).getInt32(0);

  ffi.types.float.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.float);
    new DataView(a.buffer).setFloat32(0, value);
  };
  ffi.types.float.unwrap = (a) =>
    new DataView(a.buffer).getFloat32(0);

  ffi.types.double.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.double);
    new DataView(a.buffer).setFloat64(0, value);
    return a;
  };
  ffi.types.double.unwrap = (a) =>
    new DataView(a.buffer).getFloat64(0);

  const makeNumberWrapper = (type) =>
    (value) => {
      let mask;
      let eight;
      let zero;
      if (typeof value === 'number') {
        mask = 0xFF;
        eight = 8;
        zero = 0;
      } else if (typeof value === 'bigint') { // eslint-disable-line valid-typeof
        mask = 0xFFn;
        mask = 8n;
        zero = 0n;
      } else {
        throw new TypeError();
      }
      const a = new Uint8Array(ffi.sizeof[type]);
      let i = 0;
      while (value > zero) {
        if (i > ffi.sizeof[type]) {
          throw new RangeError();
        }
        a[i] = Number(value & mask);
        i += 1;
        value >>= eight;
      }
      return a;
    };

  const makeNumberUnwrapper = () =>
    (a) => {
      let value = 0n;
      let b = 1n;
      for (let i = 0; i < a.length; i += 1) {
        const digit = BigInt(a[i]);
        value += digit * b;
        b <<= 8n;
      }
      if (value < MAX_SAFE_INTEGER) {
        return Number(value);
      }
      return value;
    };

  ffi.types.uint64.wrap = makeNumberWrapper('uint64');
  ffi.types.uint64.unwrap = makeNumberUnwrapper('uint64');

  ffi.types.int64.wrap = makeNumberWrapper('int64');
  ffi.types.int64.unwrap = makeNumberUnwrapper('int64');

  ffi.types.ulonglong.wrap = makeNumberWrapper('ulonglong');
  ffi.types.longlong.wrap = makeNumberWrapper('longlong');

  ffi.types.pointer.wrap = (value) => {
    const a = new Uint8Array(ffi.sizeof.pointer);
    if (typeof value === 'string') {
      const { TextEncoder } = load('whatwg/encoding');
      const c = new TextEncoder().encode(`${value}\0`);
      ffi.writePointer(a, 0, c);
    }
    return a;
  };
  ffi.types.pointer.unwrap = (a) => a;

  function CFI(fn, returnType, argTypes) {
    const atypes = new Uint8Array(argTypes.length * ffi.ffi_type_size);
    argTypes.forEach((arg, i) => {
      const t = ffi.types[arg];
      ffi.writePointer(atypes, i * ffi.ffi_arg_size, t);
    });

    const cif = new Uint8Array(ffi.ffi_cif_size);

    ffi.ffi_prep_cif(cif, argTypes.length, ffi.types[returnType], atypes);

    return (...args) => {
      const ab = new Uint8Array(args.length * ffi.ffi_arg_size);
      args.forEach((arg, i) => {
        const type = ffi.types[argTypes[i]];
        ffi.writePointer(ab, i * ffi.ffi_arg_size, type.wrap(arg));
      });

      const ret = new Uint8Array(ffi.sizeof[returnType]);

      ffi.ffi_call(cif, fn, ret, ab);

      return ffi.types[returnType].unwrap(ret);
    };
  }

  const dlopen = CFI(ffi.dlopen, 'pointer', ['pointer']);
  const dlsym = CFI(ffi.dlsym, 'pointer', ['pointer', 'pointer']);
  const dlerror = CFI(ffi.dlerror, 'void', []);
  // const dlclose = CFI(ffi.dlclose, 'void', ['pointer']);

  let lazyURL;

  const loadDynamicLibrary = async (url, functions) => {
    if (lazyURL === undefined) {
      lazyURL = load('whatwg/url');
    }
    const { getURLFromFilePath, getFilePathFromURL, URL } = lazyURL;

    const file = getFilePathFromURL(new URL(url, `${getURLFromFilePath(process.cwd)}/`));

    const handle = dlopen(file);
    dlerror();

    const o = {};
    Object.keys(functions).forEach((name) => {
      const ptr = dlsym(handle, name);
      const [ret, args] = functions[name];
      const fn = CFI(ptr, ret, args);
      o[name] = fn;
    });

    return o;
  };

  global.edge.loadDynamicLibrary = loadDynamicLibrary;

  global.edge.test = CFI(ffi.test, 'int', ['pointer']);
};