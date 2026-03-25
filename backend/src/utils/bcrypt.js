import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
