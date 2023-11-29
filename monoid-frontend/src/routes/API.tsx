// import { FC, useCallback, useContext } from 'react';

// import { FormProvider, useForm } from 'react-hook-form';
// import APIContext from 'src/contexts/API';
// import { useParams } from 'react-router-dom';
// import APIInformationSocket from '../sockets/APIInformationSocket';
// import APITestingSocket from '../sockets/APITestingSocket';

// const API: FC = () => {
//   const methods = useForm({
//     defaultValues: {
//       endpoint: '',
//     },
//   });

//   const { setValue, watch } = methods;
//   const { endpoint } = watch();
//   const { param } = useContext( APIContext );

//   // const { data } = useQuery<TApiActionPayload, unknown, TApiActionResponse>({
//   //   queryKey: [ 'apiAction', actionId ],
//   //   queryFn: () => getApiAction({ actionId: Number( actionId ) }),
//   //   enabled: Number( actionId || 0 ) > 0,
//   // });

//   const handleRemovePathParam = useCallback(
//     ( x: string ) => {
//       const newEndpoint = endpoint.replace( `{${x}}`, '' );
//       setValue( 'endpoint', newEndpoint );
//     },
//     [ endpoint, setValue ],
//   );

//   const handleUpsertPathParam = useCallback(
//     ({ key, newValue }: { key: string; newValue: string }) => {
//       const pathParam = param.find( item => item.tabId === 'path-params' );
//       const keyForReplacement = pathParam?.data.find( item => item.key === key );
//       const oldValue = keyForReplacement?.data.api_key;

//       if ( endpoint.includes( `{${oldValue}}` )) {
//         setValue(
//           'endpoint',
//           endpoint.replace( `{${oldValue}}`, `{${newValue}}` ),
//         );
//       } else {
//         setValue( 'endpoint', `${endpoint}{${newValue}}` );
//       }
//     },
//     [ endpoint, param, setValue ],
//   );

//   return (
//     <div>
//       <div className="flex h-screen gap-4">
//         <FormProvider {...methods}>
//           <APIInformationSocket
//             onRemovePathParam={handleRemovePathParam}
//             onUpsertPathParam={handleUpsertPathParam}
//           />
//           <APITestingSocket />
//         </FormProvider>
//       </div>
//     </div>
//   );
// };

// export default API;
