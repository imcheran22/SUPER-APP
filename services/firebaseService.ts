// Mock implementation for demo purposes without real Firebase config
export const initFirebase = (): boolean => {
  console.log("Firebase initialized (Mock)");
  return true;
};

export const loginWithGoogle = async (): Promise<{ user: any; accessToken: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          uid: 'mock-user-123',
          displayName: 'Demo User',
          email: 'user@example.com',
          photoURL: 'https://picsum.photos/200'
        },
        accessToken: 'mock-access-token-xyz'
      });
    }, 1000);
  });
};

export const logoutUser = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Logged out");
      resolve();
    }, 500);
  });
};