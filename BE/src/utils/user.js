const defaultProfilePicture = `${process.env.CLIENT_URL || "http://localhost:5173"}/images/neon-hooded-hacker.svg`;

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture || defaultProfilePicture,
    createdAt: user.createdAt,
  };
}
