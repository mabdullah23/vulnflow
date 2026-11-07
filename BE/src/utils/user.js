export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
  };
}
