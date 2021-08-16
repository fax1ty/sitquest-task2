import { Avatar, CornerDialog, FormField, Heading, Pane, Paragraph, Portal, SideSheet, Strong, Table, Text, Textarea, TextInput, toaster, Tooltip } from 'evergreen-ui';
import { useMediaQuery } from 'react-responsive';
import DeckGL, { GeoJsonLayer, IconLayer } from 'deck.gl';
import { StaticMap, MapContext } from 'react-map-gl';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, FileArrowUp, FileMinus, FilePlus, House, MagnifyingGlassMinus, MagnifyingGlassPlus, MapPin, Pencil, Polygon, Share, SignIn, SignOut, SlidersHorizontal, Stack, Trash, X } from 'phosphor-react';
import { useLocation } from '@reach/router';
import useLocalStorage from 'react-use-localstorage';
import Skeleton from '@yisheng90/react-loading';
import { EReCaptchaV2Size, EReCaptchaV2Theme, ReCaptchaV2 } from 'react-recaptcha-x';
import api from '../api';
import { useBus, useListener } from 'react-bus';
import styles from '../styles';
import { isDesktop } from 'react-device-detect';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export enum UserRole {
  UNKNOWN, USER, ADMIN
}

export interface User {
  name: string;
  email: string;
  token: string;
  role: UserRole;
  photo: string;
}

export enum ActivityId {
  UNKNOWN = 0,

  // Send
  AUTH = 1,

  // Get
  NEW_MARKER = 101,
  REMOVE_MARKER = 102,
  NEW_LAYER = 105,
  REMOVE_LAYER = 106,
  EDIT_LAYER = 107
}

const randomBetween = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export default function Home(props: { path: string; query?: string; }) {
  const isMini = useMediaQuery({ query: '(max-width: 1224px)' });

  const [tooltipData, setTooltipData] = useState<{ special?: string; title: string; description?: string; } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 50.190723032260181,
    latitude: 53.195163034650506,
    zoom: 11
  });
  const [layersEnabled, setlayersEnabled] = useState(false);
  const [markersEnabled, setMarkersEnabled] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useLocalStorage('token', '');
  const [googleTestPassed, setGoogleTestPassed] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [editModeNoUserShown, setEditModeNoUserShown] = useState(false);
  const [markers, setMarkers] = useState<Array<{ name: string; coordinates: Array<number>, url: string; reviewed: boolean; virtual?: boolean; }>>([]);
  const [layers, setLayers] = useState<{ type: string; features: Array<{ type: 'Feature', properties: { id: string; name: string; description: string; }, geometry: { type: string; coordinates: any; } }> }>({ type: 'FeatureCollection', features: [] });

  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerUrl, setNewMarkerUrl] = useState('');
  const [newMarkerPosition, setNewMarkerPosition] = useState<Array<number>>([]);

  const [adminPage, setAdminPage] = useState('');
  const [adminSelectedMarker, setAdminSelectedMarker] = useState<{ name: string; coordinates: Array<number>, url: string; reviewed: boolean; virtual?: boolean; } | null>(null);
  const [adminSelectedLayerName, setAdminSelectedLayerName] = useState('');
  const [adminSelectedLayerDescription, setAdminSelectedLayerDescrition] = useState('');
  const [adminSelectedLayerJSON, setAdminSelectedLayerJSON] = useState('');
  const [adminSelectedLayerId, setAdminSelectedLayerId] = useState('');

  const polyLayer = new GeoJsonLayer({
    data: layers,
    visible: layersEnabled,
    stroked: false,
    filled: true,
    extruded: false,
    pickable: true,
    getFillColor: () => [randomBetween(0, 255), randomBetween(0, 255), randomBetween(0, 255), 100]
  });
  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
  }
  const markerLayer = new IconLayer<any>({
    data: markers,
    pickable: true,
    visible: markersEnabled,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: ICON_MAPPING,
    getIcon: () => 'marker',
    getSize: () => 6,
    sizeScale: 5,
    getPosition: d => d.coordinates
  });

  const location = useLocation();
  const bus = useBus();

  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => setIsEmbed(new URLSearchParams(location?.search).get('embed') === 'true'), [location]);
  useEffect(() => {
    api.map.getMarkers()
      .then(({ items }) => setMarkers(items))
      .catch(e => console.error(e));
    api.map.getLayers()
      .then(setLayers)
      .catch(e => console.error(e));
  }, []);

  useListener('token', token => setToken(token));
  useListener('user', user => {
    setUser(user);
    if (!user) setEditMode(false);
  });

  useEffect(() => {
    if (!bus) return;
    if (!token) return;
    if (user) return;

    api.users.login(token)
      .then(({ name, token, email, role }) => {
        bus.emit('token', token);
        bus.emit('user', { name, token, email, role, photo: '' });
      })
      .catch(() => {
        bus.emit('token', '');
        bus.emit('user', null);
      });
    // eslint-disable-next-line
  }, [bus]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(process.env.REACT_APP_BACKEND_WS as any);

  useEffect(() => {
    if (!lastMessage) return;
    let args = (lastMessage.data as string).split('|');
    if (!args[0]) return;
    let activity = parseInt(args[0]);
    if (activity === ActivityId.NEW_MARKER) {
      let name = args[1];
      let url = args[2];
      let coordinates = [parseFloat(args[3]), parseFloat(args[4])];
      setMarkers(m => [...m, { name, url, coordinates, reviewed: false }]);
    }
    if (activity === ActivityId.REMOVE_MARKER) {
      let coordinates = [parseFloat(args[1]), parseFloat(args[2])];
      let toRemove = markers.findIndex(m => m.coordinates === coordinates);
      alert(coordinates + ' / ' + toRemove);
      if (toRemove > -1) {
        setMarkers(m => {
          let oldArray = [...m];
          oldArray.splice(toRemove, 1);
          return oldArray;
        });
      }
    }
    if (activity === ActivityId.NEW_LAYER) {
      let id = args[1];
      let name = args[2];
      let description = args[3];
      let geometry = JSON.parse(args[4]);
      setLayers(l => ({ ...l, features: [...l.features, { type: 'Feature', properties: { name, description, id }, geometry }] }));
    }
    if (activity === ActivityId.REMOVE_LAYER) {
      let id = args[1];
      setLayers(l => {
        let f = [...l.features];
        let i = f.findIndex(p => p.properties.id === id);
        f.splice(i, 1);
        return ({ ...l, features: f });
      });
    }
    if (activity === ActivityId.EDIT_LAYER) {
      let id = args[1];
      let name = args[2];
      let description = args[3];
      let geometry = JSON.parse(args[4]);
      setLayers(l => {
        let f = [...l.features];
        let i = f.findIndex(p => p.properties.id === id);
        f[i] = { type: 'Feature', properties: { name, description, id }, geometry }
        return { ...l, features: f }
      });
    }
    // eslint-disable-next-line
  }, [lastMessage]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) sendMessage(`${ActivityId.AUTH}|${token}`);
    // eslint-disable-next-line
  }, [readyState]);

  return (
    <Pane display='flex' flex={1} alignItems='center' justifyContent='center' flexDirection='column' gap={25} backgroundColor={styles.colors.gray}>
      <DeckGL
        getCursor={(e: any) => {
          if (editMode) return 'pointer';
          if (e.isHovering) return 'pointer';
          return 'move';
        }}
        viewState={viewState}
        onViewStateChange={state => setViewState(state.viewState)}
        controller={true}
        layers={[polyLayer, markerLayer]}
        onClick={(e: any) => {
          if (editMode) {
            setTooltipData({ special: 'add-marker', title: 'Добавление маркера' });
            setMarkers(m => [...m, { name: 'Test', coordinates: e.coordinate, virtual: true, reviewed: false, url: '' }]);
            setNewMarkerPosition(e.coordinate);
            return;
          }
          if (!e.object) return;
          if (e.layer.id === 'IconLayer') setTooltipData({ title: e.object.name, description: e.object.url });
          else setTooltipData({ title: e.object.properties?.name, description: e.object.properties?.description });
        }}
        ContextProvider={MapContext.Provider}
      >
        <StaticMap mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN} />
      </DeckGL>

      <CornerDialog title='Кажется, мы Вас не знаем...' isShown={editModeNoUserShown} onCloseComplete={() => setEditModeNoUserShown(false)} cancelLabel='В другой раз' confirmLabel='Да, давайте' onConfirm={() => {
        setTooltipData({ special: 'auth', title: 'Авторизация' });
        setEditModeNoUserShown(false);
      }} containerProps={{ maxWidth: '100vw', borderRadius: isMini ? 0 : 8, minWidth: isMini ? '100vw' : null, right: isMini ? 0 : 25, bottom: isMini ? 0 : 25 }}>
        Пожалуйста, войдите для использования режима редактирования. Как только Вы войдёте, Вы сможете создавать новые места и редактировать существующие
      </CornerDialog>

      <SideSheet isShown={tooltipData !== null} onCloseComplete={() => {
        setAdminPage('');
        setTooltipData(null);
        let virtual = markers.findIndex(m => m.virtual);
        if (virtual > -1) {
          setMarkers(m => {
            let oldArray = [...m];
            oldArray.splice(virtual, 1);
            return oldArray;
          });
        }
        setNewMarkerName('');
        setNewMarkerUrl('');
        setNewMarkerPosition([]);
      }} shouldCloseOnOverlayClick={false} onBeforeClose={() => setGoogleTestPassed(false)}>
        <Pane padding={40} display='flex' flexDirection='column' maxWidth='100vw' gap={25}>
          <Heading size={900}>{tooltipData?.title}</Heading>

          {!tooltipData?.special &&
            <Pane display='flex' flexDirection='column' gap={15}>
              <Paragraph>{tooltipData?.description}</Paragraph>
            </Pane>
          }

          {tooltipData?.special === 'settings' &&
            <Pane display='flex'>
              {adminPage === '' &&
                <Pane display='flex' flexDirection='column' gap={25}>

                  <Pane display='flex' gap={25} flexDirection='row' padding={25} borderRadius={8} className='control-button' cursor='pointer' alignItems='center' onClick={() => {
                    setAdminPage('markers');
                  }}>
                    <MapPin color={styles.colors.white} size={25} weight='bold' style={{ backgroundColor: styles.colors.red, padding: 15, borderRadius: 8, flexShrink: 0 }} />
                    <Pane display='flex' flexDirection='column' gap={10}>
                      <Heading>Модерация маркеров</Heading>
                      <Text>Здесь можно утвердить новые или удалить существующие маркеры (места)</Text>
                    </Pane>
                  </Pane>

                  <Pane display='flex' gap={25} flexDirection='row' padding={25} borderRadius={8} className='control-button' cursor='pointer' alignItems='center' onClick={() => {
                    setAdminPage('layers');
                  }}>
                    <Stack color={styles.colors.white} size={25} weight='bold' style={{ backgroundColor: styles.colors.red, padding: 15, borderRadius: 8, flexShrink: 0 }} />
                    <Pane display='flex' flexDirection='column' gap={10}>
                      <Heading>Управление слоями</Heading>
                      <Text>Районы, <del>кварталы</del>, жилые массивы</Text>
                    </Pane>
                  </Pane>

                </Pane>
              }

              {adminPage === 'markers' &&
                <Pane display='flex' width='100%' flexDirection='column' gap={25}>
                  <Table>
                    <Table.Head>
                      <Table.SearchHeaderCell placeholder='Название' />
                      <Table.TextHeaderCell>URL</Table.TextHeaderCell>
                      <Table.TextHeaderCell>Координаты</Table.TextHeaderCell>
                    </Table.Head>
                    <Table.Body height={240}>
                      {markers.sort((a, b) => {
                        if (a.reviewed && !b.reviewed) return 1;
                        if (b.reviewed && !a.reviewed) return -1;
                        return 0;
                      }).map(m => (
                        <Table.Row isSelectable onSelect={() => setAdminSelectedMarker(m)} intent={m.reviewed ? 'success' : 'danger'}>
                          <Table.TextCell>{m.name}</Table.TextCell>
                          <Table.TextCell>{m.url}</Table.TextCell>
                          <Table.TextCell>{`Lat: ${m.coordinates[0].toFixed(3)} / Lng: ${m.coordinates[1].toFixed(3)}`}</Table.TextCell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>

                  {adminSelectedMarker &&
                    <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                      api.map.reviewMarker(token, adminSelectedMarker.coordinates, !adminSelectedMarker.reviewed)
                        .then(() => {
                          setMarkers(old => {
                            let copy = [...old];
                            let i = copy.findIndex(m => m.coordinates === adminSelectedMarker.coordinates);
                            setAdminSelectedMarker({ name: copy[i].name, url: copy[i].url, coordinates: copy[i].coordinates, reviewed: copy[i].reviewed ? false : true });
                            copy[i] = { name: copy[i].name, url: copy[i].url, coordinates: copy[i].coordinates, reviewed: copy[i].reviewed ? false : true }
                            return copy;
                          });
                        })
                        .catch(e => console.error(e));
                    }} className='control-button'>
                      <Eye size={20} weight='bold' color={styles.colors.darkBlue} />
                      <Strong>{adminSelectedMarker?.reviewed ? 'Убрать' : 'Поставить'} отметку "Просмотрено"</Strong>
                    </Pane>
                  }
                  {adminSelectedMarker &&
                    <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                      api.map.removeMarker(token, adminSelectedMarker.coordinates)
                        .catch(e => console.error(e));
                    }} className='control-button'>
                      <Trash size={20} weight='bold' color={styles.colors.darkBlue} />
                      <Strong>Удалить маркер</Strong>
                    </Pane>}

                  <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                    setAdminPage('');
                  }} className='control-button'>
                    <ArrowLeft size={20} weight='bold' color={styles.colors.darkBlue} />
                    <Strong>В главное меню</Strong>
                  </Pane>
                </Pane>
              }
            </Pane>
          }

          {adminPage === 'layers' &&
            <Pane display='flex' width='100%' flexDirection='column' gap={25}>
              <Pane display='flex' flexDirection='column' gap={25}>
                <Pane display='flex' gap={25} flexDirection='row' padding={10} borderRadius={8} className='control-button' cursor='pointer' alignItems='center' onClick={() => {
                  setAdminPage('add-layer');
                }}>
                  <FilePlus color={styles.colors.white} size={25} weight='bold' style={{ backgroundColor: styles.colors.red, padding: 15, borderRadius: 8, flexShrink: 0 }} />
                  <Pane display='flex' flexDirection='column' gap={10}>
                    <Heading>Добавить новый слой</Heading>
                  </Pane>
                </Pane>
                {layers.features.map(f =>
                  <Pane key={f.properties.id} display='flex' gap={25} flexDirection='row' padding={10} borderRadius={8} className='control-button' cursor='pointer' alignItems='center' onClick={() => {
                    setAdminPage('edit-layer');
                    setAdminSelectedLayerName(f.properties.name);
                    setAdminSelectedLayerDescrition(f.properties.description);
                    setAdminSelectedLayerId(f.properties.id);
                    setAdminSelectedLayerJSON(JSON.stringify(f.geometry));
                  }}>
                    <Polygon color={styles.colors.white} size={25} weight='bold' style={{ backgroundColor: styles.colors.red, padding: 15, borderRadius: 8, flexShrink: 0 }} />
                    <Pane display='flex' flexDirection='column' gap={10}>
                      <Heading>{f.properties.name}</Heading>
                    </Pane>
                  </Pane>
                )}
              </Pane>

              <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                setAdminPage('');
              }} className='control-button'>
                <ArrowLeft size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>В главное меню</Strong>
              </Pane>
            </Pane>
          }

          {tooltipData?.special === 'add-marker' &&
            <Pane display='flex' flexDirection='column' gap={25}>
              <FormField label={false} display='flex' flexDirection='column' gap={25}>
                <TextInput value={newMarkerName} required={true} onChange={(e: any) => setNewMarkerName(e.target.value)} width='100%' height={40} placeholder='Название' />
                <TextInput value={newMarkerUrl} required={true} onChange={(e: any) => setNewMarkerUrl(e.target.value)} width='100%' height={40} placeholder='URL' />
              </FormField>
              <Pane display='flex' width='100%' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                api.map.addMarker(token, newMarkerName, newMarkerUrl, newMarkerPosition)
                  .then(({ name, url, coordinates }) => {
                    setTooltipData(null);
                    setMarkers(m => [...m, { name, url, coordinates, reviewed: false }]);
                  })
                  .catch(e => console.error(e));
              }} className='control-button'>
                <FilePlus size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>Добавить маркер</Strong>
              </Pane>
            </Pane>
          }

          {adminPage === 'add-layer' &&
            <Pane display='flex' flexDirection='column' gap={25}>
              <FormField label={false} display='flex' flexDirection='column' gap={25}>
                <TextInput value={adminSelectedLayerName} required={true} onChange={(e: any) => setAdminSelectedLayerName(e.target.value)} width='100%' height={40} placeholder='Название' />
                <Textarea value={adminSelectedLayerDescription} required={true} onChange={(e: any) => setAdminSelectedLayerDescrition(e.target.value)} width='100%' height={40} placeholder='Описание' />
                <Textarea value={adminSelectedLayerJSON} required={true} onChange={(e: any) => setAdminSelectedLayerJSON(e.target.value)} width='100%' height={40} placeholder='GeoJSON. { "type": "Polygon", "coordinates": [] }' />
              </FormField>
              <Pane display='flex' width='100%' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                api.map.addLayer(token, adminSelectedLayerName, adminSelectedLayerDescription, adminSelectedLayerJSON)
                  .then(() => {
                    setAdminSelectedLayerDescrition('');
                    setAdminSelectedLayerName('');
                    setAdminSelectedLayerJSON('');
                    toaster.success('Всё готово. Новый слой создан', { duration: 1 });
                  })
                  .catch(e => {
                    toaster.danger('Что-то пошло не так. Попробуйте ещё раз', { duration: 1 });
                  });
              }} className='control-button'>
                <FilePlus size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>Добавить слой</Strong>
              </Pane>
              <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                setAdminPage('layers');
              }} className='control-button'>
                <ArrowLeft size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>К управлению слоями</Strong>
              </Pane>
            </Pane>
          }

          {adminPage === 'edit-layer' &&
            <Pane display='flex' flexDirection='column' gap={25}>
              <FormField label={false} display='flex' flexDirection='column' gap={25}>
                <TextInput value={adminSelectedLayerName} required={true} onChange={(e: any) => setAdminSelectedLayerName(e.target.value)} width='100%' height={40} placeholder='Название' />
                <Textarea value={adminSelectedLayerDescription} required={true} onChange={(e: any) => setAdminSelectedLayerDescrition(e.target.value)} width='100%' height={40} placeholder='Описание' />
                <Textarea value={adminSelectedLayerJSON} required={true} onChange={(e: any) => setAdminSelectedLayerJSON(e.target.value)} width='100%' height={40} placeholder='GeoJSON. { "type": "Polygon", "coordinates": [] }' />
              </FormField>
              <Pane display='flex' width='100%' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                api.map.updateLayer(token, adminSelectedLayerId, adminSelectedLayerName, adminSelectedLayerDescription, adminSelectedLayerJSON)
                  .then(() => {
                    toaster.success('Слой был успешно обновлён', { duration: 1 })
                  })
                  .catch(e => console.error(e));
              }} className='control-button'>
                <FileArrowUp size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>Обновить слой</Strong>
              </Pane>
              <Pane display='flex' width='100%' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                api.map.removeLayer(token, adminSelectedLayerId)
                  .then(() => {
                    setAdminPage('layers');
                    setAdminSelectedLayerId('');
                    setAdminSelectedLayerName('');
                    setAdminSelectedLayerDescrition('');
                    setAdminSelectedLayerJSON('');
                    toaster.success('Слой был успешно удалён', { duration: 1 })
                  })
                  .catch(e => console.error(e));
              }} className='control-button'>
                <FileMinus size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>Удалить слой</Strong>
              </Pane>
              <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} cursor='pointer' onClick={() => {
                setAdminPage('layers');
                setAdminSelectedLayerId('');
                setAdminSelectedLayerName('');
                setAdminSelectedLayerDescrition('');
                setAdminSelectedLayerJSON('');
              }} className='control-button'>
                <ArrowLeft size={20} weight='bold' color={styles.colors.darkBlue} />
                <Strong>К управлению слоями</Strong>
              </Pane>
            </Pane>
          }

          {tooltipData?.special === 'share-map' &&
            <Pane display='flex' flexDirection='column' gap={25}>
              <Paragraph>Пока доступен лишь один способ - вставить карту на свой сайт. Скопируйте код из поля снизу и вставьте его в удобное место</Paragraph>
              <Textarea>{`<iframe width="560" height="315" src="${location.host}/?embed=true" title="Лучшая карта на свете" frameborder="0" allowfullscreen></iframe>`}</Textarea>
            </Pane>
          }

          {tooltipData?.special === 'auth' &&
            <Pane display='flex' flexDirection='column' gap={25}>
              <FormField label={false} display='flex' flexDirection='column' gap={25}>
                <TextInput value={inputEmail} required={true} onChange={(e: any) => setInputEmail(e.target.value)} type='email' width='100%' height={40} placeholder='E-mail' />
                <TextInput value={inputPassword} required={true} onChange={(e: any) => setInputPassword(e.target.value)} type='password' width='100%' height={40} placeholder='Пароль' />
              </FormField>
              <Pane display='flex' gap={15} alignItems='center' padding={15} borderRadius={8} backgroundColor={googleTestPassed ? null : styles.colors.blue} cursor={googleTestPassed ? 'pointer' : 'not-allowed'} onClick={() => {
                if (!googleTestPassed) return;
                api.users.login(inputEmail, inputPassword)
                  .then(({ token, email, name, role }) => {
                    bus.emit('token', token);
                    bus.emit('user', { token, email, name, photo: '', role });
                    setGoogleTestPassed(false);
                    setTooltipData(null);
                  })
                  .catch(e => console.error(e));
              }} className={googleTestPassed ? 'control-button' : undefined} aria-disabled={!googleTestPassed}>
                <SignIn size={20} weight='bold' color={googleTestPassed ? styles.colors.darkBlue : styles.colors.white} />
                <Strong color={googleTestPassed ? null : styles.colors.white}>Войти</Strong>
              </Pane>
              <ReCaptchaV2
                callback={e => {
                  if (e === false) setGoogleTestPassed(false);
                  else setGoogleTestPassed(true);
                }}
                theme={EReCaptchaV2Theme.Light}
                size={EReCaptchaV2Size.Normal}
                tabindex={0}
                style={{ maxWidth: '90vw' }}
              />
            </Pane>
          }

          {isMini &&
            <Pane display='flex' gap={15} alignItems='center' marginTop={25} padding={15} borderRadius={8} cursor='pointer' onClick={() => setTooltipData(null)} className='control-button'>
              <X size={20} weight='bold' color={styles.colors.darkBlue} />
              <Strong>Закрыть окошечко</Strong>
            </Pane>
          }
        </Pane>
      </SideSheet>

      <Portal>
        <Pane position='fixed' width={isMini ? '100vw' : null} left={isMini ? 0 : 25} bottom={isMini ? 0 : 25} display='flex' flexDirection={isMini ? 'row' : 'column-reverse'} justifyContent='center' gap={25} backgroundColor={styles.colors.white} padding={15} borderRadius={isMini ? 0 : 8}>
          <Tooltip content='Приблизить масштаб' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
            <MagnifyingGlassPlus size={20} weight='bold' color={styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className='control-button' onClick={() => {
              setViewState({ ...viewState, zoom: viewState.zoom + 1 > 16 ? 16 : viewState.zoom + 1 });
            }} />
          </Tooltip>
          <Tooltip content='Отдалить масштаб' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
            <MagnifyingGlassMinus size={20} weight='bold' color={styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className='control-button' onClick={() => {
              setViewState({ ...viewState, zoom: viewState.zoom - 1 < 1 ? 1 : viewState.zoom - 1 });
            }} />
          </Tooltip>
          <Tooltip content='Слой "Районы"' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
            <Polygon size={20} weight='bold' color={layersEnabled ? styles.colors.white : styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className={layersEnabled ? 'control-button-enabled' : 'control-button'} onClick={() => {
              setlayersEnabled(!layersEnabled);
            }} />
          </Tooltip>
          <Tooltip content='Слой "Маркеры"' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
            <House size={20} weight='bold' color={markersEnabled ? styles.colors.white : styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className={markersEnabled ? 'control-button-enabled' : 'control-button'} onClick={() => {
              setMarkersEnabled(!markersEnabled);
            }} />
          </Tooltip>
          {!isEmbed &&
            <Tooltip content='Режим редактирования' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
              <Pencil size={20} weight='bold' color={editMode ? styles.colors.white : styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className={editMode ? 'control-button-enabled' : 'control-button'} onClick={() => {
                if (!user) setEditModeNoUserShown(true);
                else setEditMode(!editMode);
              }} />
            </Tooltip>
          }
          {isMini &&
            <Tooltip content='Поделиться картой' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
              <Share size={20} weight='bold' color={styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className='control-button' onClick={() => {
                setTooltipData({ special: 'share-map', title: 'Поделиться картой' });
              }} />
            </Tooltip>
          }
        </Pane>

        {!isEmbed && token &&
          <Pane position='fixed' right={isMini ? 0 : 25} top={isMini ? 0 : 25} width={isMini ? '100vw' : null} display='flex' gap={25} alignItems='center' backgroundColor={styles.colors.white} padding={15} borderRadius={isMini ? 0 : 8}>
            {user ? <Avatar src={user.photo} size={40} onClick={() => alert('meow')} /> : <Skeleton color={styles.colors.gray} height={40} width={40} circle />}
            <Pane width={isMini ? '100%' : null} display='flex' flexDirection='column' gap={3}>
              {user ? <Heading>{user.name}</Heading> : <Skeleton color={styles.colors.gray} width={150} height={20} />}
              {user ? <Text>{user.role === UserRole.USER ? 'Пользователь' : 'Администратор'}</Text> : <Skeleton color={styles.colors.gray} width={100} height={15} />}
            </Pane>
            <Pane display='flex' gap={10}>
              {user?.role === UserRole.ADMIN &&
                <Tooltip content='Управление' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
                  <SlidersHorizontal size={20} weight='bold' color={styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className='control-button' onClick={() => {
                    setTooltipData({ special: 'settings', title: 'Управление' });
                  }} />
                </Tooltip>
              }
              <Tooltip content='Выйти' statelessProps={{ backgroundColor: styles.colors.darkBlue, display: isDesktop ? null : 'none' }}>
                <SignOut size={20} weight='bold' color={styles.colors.darkBlue} style={{ borderRadius: 8, padding: 15, cursor: 'pointer' }} className='control-button' onClick={() => {
                  bus.emit('token', '');
                  bus.emit('user', null);
                }} />
              </Tooltip>
            </Pane>
          </Pane>
        }

        {!token &&
          <Pane position='fixed' right={isMini ? 0 : 25} top={isMini ? 0 : 25} width={isMini ? '100vw' : null} display='flex' gap={25} alignItems='center' justifyContent='center' backgroundColor={styles.colors.white} padding={15} borderRadius={isMini ? 0 : 8} cursor='pointer' onClick={() => {
            setTooltipData({ special: 'auth', title: 'Авторизация' });
          }}>
            <Strong>Хотите <ins>войти в аккаунт</ins>?</Strong>
          </Pane>
        }

        {!isMini &&
          <Pane position='fixed' right={25} bottom={25} display='flex' gap={15} alignItems='center' backgroundColor={styles.colors.white} padding={15} borderRadius={8} cursor='pointer' className='share-map' onClick={() => {
            setTooltipData({ special: 'share-map', title: 'Поделиться картой' });
          }}>
            <Share size={20} weight='bold' color={styles.colors.darkBlue} />
            <Strong>Поделиться картой</Strong>
          </Pane>
        }
      </Portal>
    </Pane >
  );
}