import apiClient from 'src/apiClient';

const authWithGoogle = async ({ code }: { code: string }) => {
  const response = await apiClient.post( '/auth/google', {
    code,
    debug: !!import.meta.env.VITE_TUNNEL,
  });

  return response.data;
};

export default authWithGoogle;
