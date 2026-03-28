import bcrypt from 'bcryptjs';
const password = 'Admin2024!';
const hash = await bcrypt.hash(password, 10);
console.log('Hash:', hash);
