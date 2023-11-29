import camelcaseKeys from 'camelcase-keys';
import apiClient from 'src/apiClient';
import getRequestHeader from 'src/utils/getRequestHeader';

const getProjectChatConfig = async ({
  subdomain,
  slug,
}: {
  subdomain: string;
  slug: string;
}) => {
  const response = await apiClient.get( `/agent/url/${subdomain}/${slug}`, {
    headers: getRequestHeader(),
  });

  return camelcaseKeys( response.data );
};

export default getProjectChatConfig;
