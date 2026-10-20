// Client playback nonce and cryptographic token utilities
function generateCpn() {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
      let c = '';
      for (let i = 0; i < 16; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
      return c;
    }

window.generateCpn = generateCpn;
