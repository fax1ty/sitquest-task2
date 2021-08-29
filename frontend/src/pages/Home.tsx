import {
    Avatar,
    Button,
    CornerDialog,
    Heading,
    Pane,
    Portal,
    Strong,
    Text,
    TextInput,
    Tooltip,
    toaster,
} from "evergreen-ui";
import { useMediaQuery } from "react-responsive";
import DeckGL, { GeoJsonLayer, IconLayer } from "deck.gl";
import { StaticMap, MapContext } from "react-map-gl";
import { useEffect, useState } from "react";
import {
    House,
    MagnifyingGlassMinus,
    MagnifyingGlassPlus,
    Pencil,
    Polygon,
    Share,
    SignOut,
    SlidersHorizontal,
} from "phosphor-react";
import { useLocation } from "@reach/router";
import useLocalStorage from "react-use-localstorage";
import Skeleton from "@yisheng90/react-loading";
import styles from "../styles";
import { isDesktop } from "react-device-detect";
import useWebSocket, { ReadyState } from "react-use-websocket";
import SideView from "../components/SideView";
import store from "../store";
import api from "../api";
import { Place } from "../api";

export enum UserRole {
    UNKNOWN,
    USER,
    ADMIN,
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
    EDIT_LAYER = 107,
}

const randomBetween = (min: number, max: number) =>
    min + Math.floor(Math.random() * (max - min + 1));

export default function Home(props: { path: string; query?: string }) {
    const isMini = useMediaQuery({ query: "(max-width: 1224px)" });

    const [viewState, setViewState] = useState({
        longitude: 50.190723032260181,
        latitude: 53.195163034650506,
        zoom: 17,
    });
    const [layersEnabled, setlayersEnabled] = useState(false);
    const [markersEnabled, setMarkersEnabled] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editModeNoUserShown, setEditModeNoUserShown] = useState(false);

    const [sideViewOpen, setSideViewOpen] = useState(false);
    const [sideViewSpecial, setSideViewSpecial] = useState<
        "settings" | "add-marker" | "add-layer" | "share-map" | "auth" | ""
    >("");
    const [sideViewTitle, setSideViewTitle] = useState("");
    const [sideViewDescription, setSideViewDescription] = useState("");

    const [addresses, setAddresses] = useState(new Array<Place>());
    const [searchInput, setSearchInput] = useState("");

    const [localToken] = useLocalStorage("token", "");
    useEffect(() => {
        store.setToken(localToken);
        store.updateUserToken(localToken);
    }, [localToken]);

    const polyLayer = new GeoJsonLayer({
        data: store.layers,
        visible: layersEnabled,
        stroked: false,
        filled: true,
        extruded: false,
        pickable: true,
        getFillColor: () => [
            randomBetween(0, 255),
            randomBetween(0, 255),
            randomBetween(0, 255),
            100,
        ],
    });
    const ICON_MAPPING = {
        marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
    };
    const markerLayer = new IconLayer<any>({
        data: store.markers,
        pickable: true,
        visible: markersEnabled,
        iconAtlas:
            "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
        iconMapping: ICON_MAPPING,
        getIcon: () => "marker",
        getSize: () => 6,
        sizeScale: 5,
        getPosition: (d) => d.coordinates,
    });

    const location = useLocation();

    const [isEmbed, setIsEmbed] = useState(false);

    useEffect(
        () =>
            setIsEmbed(
                new URLSearchParams(location?.search).get("embed") === "true"
            ),
        [location]
    );
    useEffect(() => {
        api.map
            .getMarkers()
            .then(({ items }) => store.setMarkers(items))
            .catch((e) => console.error(e));
        api.map
            .getLayers()
            .then(({ features }) => store.setLayers(features))
            .catch((e) => console.error(e));
    }, []);

    useEffect(() => {
        if (!localToken) return;

        api.users
            .login(localToken)
            .then(({ name, token, email, role }) => {
                store.setToken(token);
                store.setUser({ name, token, email, role, photo: "" });
            })
            .catch(() => {
                store.setToken("");
                store.setUser({
                    name: "",
                    token: "",
                    email: "",
                    role: UserRole.UNKNOWN,
                    photo: "",
                });
            });
        // eslint-disable-next-line
    }, []);

    const { sendMessage, lastMessage, readyState } = useWebSocket(
        process.env.REACT_APP_BACKEND_WS as any
    );

    useEffect(() => {
        if (!lastMessage) return;
        let args = (lastMessage.data as string).split("|");
        if (!args[0]) return;
        let activity = parseInt(args[0]);
        if (activity === ActivityId.NEW_MARKER) {
            let id = args[1];
            let name = args[2];
            let url = args[3];
            let coordinates = [parseFloat(args[4]), parseFloat(args[5])];
            store.addMarker({ id, name, url, coordinates, reviewed: false });
        }
        if (activity === ActivityId.REMOVE_MARKER) {
            let id = args[1];
            store.removeMarker(id);
        }
        if (activity === ActivityId.NEW_LAYER) {
            let id = args[1];
            let name = args[2];
            let description = args[3];
            let geometry = JSON.parse(args[4]);
            store.addLayer({
                type: "Feature",
                properties: { id, name, description },
                geometry,
            });
        }
        if (activity === ActivityId.REMOVE_LAYER) {
            let id = args[1];
            store.removeLayer(id);
        }
        if (activity === ActivityId.EDIT_LAYER) {
            let id = args[1];
            let name = args[2];
            let description = args[3];
            let geometry = JSON.parse(args[4]);
            store.updateLayer({
                type: "Feature",
                properties: { id, name, description },
                geometry,
            });
        }
        // eslint-disable-next-line
    }, [lastMessage]);

    const toggleSideView = () => setSideViewOpen(!sideViewOpen);

    useEffect(() => {
        if (readyState === ReadyState.OPEN)
            sendMessage(`${ActivityId.AUTH}|${localToken}`);
        // eslint-disable-next-line
    }, [readyState]);

    const setSideViewData = (
        special:
            | "settings"
            | "add-marker"
            | "add-layer"
            | "share-map"
            | "auth"
            | "",
        title?: string,
        description?: string
    ) => {
        setSideViewSpecial(special);
        setSideViewTitle(title!);
        setSideViewDescription(description!);
    };

    return (
        <Pane
            display="flex"
            flex={1}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={25}
            backgroundColor={styles.colors.gray}
        >
            <DeckGL
                getCursor={(e: any) => {
                    if (editMode) return "pointer";
                    if (e.isHovering) return "pointer";
                    return "move";
                }}
                viewState={viewState}
                onViewStateChange={(state) => setViewState(state.viewState)}
                controller={true}
                layers={[polyLayer, markerLayer]}
                onClick={(e: any) => {
                    if (editMode) {
                        toggleSideView();
                        setSideViewData("add-marker", "Добавление маркера");
                        store.addMarker({
                            id: "virtual-marker",
                            name: "Test",
                            coordinates: e.coordinate,
                            virtual: true,
                            reviewed: false,
                            url: "",
                        });
                        return;
                    }
                    if (!e.object) return;
                    if (e.layer.id === "IconLayer") {
                        toggleSideView();
                        setSideViewData("", e.object.name, e.object.url);
                    } else {
                        toggleSideView();
                        setSideViewData(
                            "",
                            e.object.properties?.name,
                            e.object.properties?.description
                        );
                    }
                }}
                ContextProvider={MapContext.Provider}
            >
                <StaticMap
                    mapStyle="mapbox://styles/fax1ty/cksx41bj47o1q18qu0yanx09j"
                    mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                />
            </DeckGL>

            <CornerDialog
                title="Кажется, мы Вас не знаем..."
                isShown={editModeNoUserShown}
                onCloseComplete={() => setEditModeNoUserShown(false)}
                cancelLabel="В другой раз"
                confirmLabel="Да, давайте"
                onConfirm={() => {
                    toggleSideView();
                    setSideViewData("auth", "Авторизация");
                    setEditModeNoUserShown(false);
                }}
                containerProps={{
                    maxWidth: "100vw",
                    borderRadius: isMini ? 0 : 8,
                    minWidth: isMini ? "100vw" : null,
                    right: isMini ? 0 : 25,
                    bottom: isMini ? 0 : 25,
                }}
            >
                Пожалуйста, войдите для использования режима редактирования. Как
                только Вы войдёте, Вы сможете создавать новые места и
                редактировать существующие
            </CornerDialog>

            <SideView
                isShown={sideViewOpen}
                special={sideViewSpecial}
                title={sideViewTitle}
                description={sideViewDescription}
                onClose={toggleSideView}
            />

            <Portal>
                <Pane
                    position="fixed"
                    width={isMini ? "100vw" : null}
                    left={isMini ? 0 : 25}
                    bottom={isMini ? 0 : 25}
                    display="flex"
                    flexDirection={isMini ? "row" : "column-reverse"}
                    justifyContent="center"
                    gap={25}
                    backgroundColor={styles.colors.white}
                    padding={15}
                    borderRadius={isMini ? 0 : 8}
                >
                    <Tooltip
                        content="Приблизить масштаб"
                        statelessProps={{
                            backgroundColor: styles.colors.darkBlue,
                            display: isDesktop ? null : "none",
                        }}
                    >
                        <MagnifyingGlassPlus
                            size={20}
                            weight="bold"
                            color={styles.colors.darkBlue}
                            style={{
                                borderRadius: 8,
                                padding: 15,
                                cursor: "pointer",
                            }}
                            className="control-button"
                            onClick={() => {
                                setViewState({
                                    ...viewState,
                                    zoom:
                                        viewState.zoom + 1 > 22
                                            ? 22
                                            : viewState.zoom + 1,
                                });
                            }}
                        />
                    </Tooltip>
                    <Tooltip
                        content="Отдалить масштаб"
                        statelessProps={{
                            backgroundColor: styles.colors.darkBlue,
                            display: isDesktop ? null : "none",
                        }}
                    >
                        <MagnifyingGlassMinus
                            size={20}
                            weight="bold"
                            color={styles.colors.darkBlue}
                            style={{
                                borderRadius: 8,
                                padding: 15,
                                cursor: "pointer",
                            }}
                            className="control-button"
                            onClick={() => {
                                setViewState({
                                    ...viewState,
                                    zoom:
                                        viewState.zoom - 1 < 16
                                            ? 16
                                            : viewState.zoom - 1,
                                });
                            }}
                        />
                    </Tooltip>
                    <Tooltip
                        content='Слой "Районы"'
                        statelessProps={{
                            backgroundColor: styles.colors.darkBlue,
                            display: isDesktop ? null : "none",
                        }}
                    >
                        <Polygon
                            size={20}
                            weight="bold"
                            color={
                                layersEnabled
                                    ? styles.colors.white
                                    : styles.colors.darkBlue
                            }
                            style={{
                                borderRadius: 8,
                                padding: 15,
                                cursor: "pointer",
                            }}
                            className={
                                layersEnabled
                                    ? "control-button-enabled"
                                    : "control-button"
                            }
                            onClick={() => {
                                setlayersEnabled(!layersEnabled);
                            }}
                        />
                    </Tooltip>
                    <Tooltip
                        content='Слой "Маркеры"'
                        statelessProps={{
                            backgroundColor: styles.colors.darkBlue,
                            display: isDesktop ? null : "none",
                        }}
                    >
                        <House
                            size={20}
                            weight="bold"
                            color={
                                markersEnabled
                                    ? styles.colors.white
                                    : styles.colors.darkBlue
                            }
                            style={{
                                borderRadius: 8,
                                padding: 15,
                                cursor: "pointer",
                            }}
                            className={
                                markersEnabled
                                    ? "control-button-enabled"
                                    : "control-button"
                            }
                            onClick={() => {
                                setMarkersEnabled(!markersEnabled);
                            }}
                        />
                    </Tooltip>
                    {!isEmbed && (
                        <Tooltip
                            content="Режим редактирования"
                            statelessProps={{
                                backgroundColor: styles.colors.darkBlue,
                                display: isDesktop ? null : "none",
                            }}
                        >
                            <Pencil
                                size={20}
                                weight="bold"
                                color={
                                    editMode
                                        ? styles.colors.white
                                        : styles.colors.darkBlue
                                }
                                style={{
                                    borderRadius: 8,
                                    padding: 15,
                                    cursor: "pointer",
                                }}
                                className={
                                    editMode
                                        ? "control-button-enabled"
                                        : "control-button"
                                }
                                onClick={() => {
                                    if (!store.user.token)
                                        setEditModeNoUserShown(true);
                                    else setEditMode(!editMode);
                                }}
                            />
                        </Tooltip>
                    )}
                    {isMini && (
                        <Tooltip
                            content="Поделиться картой"
                            statelessProps={{
                                backgroundColor: styles.colors.darkBlue,
                                display: isDesktop ? null : "none",
                            }}
                        >
                            <Share
                                size={20}
                                weight="bold"
                                color={styles.colors.darkBlue}
                                style={{
                                    borderRadius: 8,
                                    padding: 15,
                                    cursor: "pointer",
                                }}
                                className="control-button"
                                onClick={() => {
                                    toggleSideView();
                                    setSideViewData(
                                        "share-map",
                                        "Поделиться картой"
                                    );
                                }}
                            />
                        </Tooltip>
                    )}
                </Pane>

                {!isEmbed && store.token && (
                    <Pane
                        position="fixed"
                        right={isMini ? 0 : 25}
                        top={isMini ? 0 : 25}
                        width={isMini ? "100vw" : null}
                        display="flex"
                        gap={25}
                        alignItems="center"
                        backgroundColor={styles.colors.white}
                        padding={15}
                        borderRadius={isMini ? 0 : 8}
                    >
                        {store.user.photo ? (
                            <Avatar
                                src={store.user.photo}
                                size={40}
                                onClick={() => alert("meow")}
                            />
                        ) : (
                            <Skeleton
                                color={styles.colors.gray}
                                height={40}
                                width={40}
                                circle
                            />
                        )}
                        <Pane
                            width={isMini ? "100%" : null}
                            display="flex"
                            flexDirection="column"
                            gap={3}
                        >
                            {store.user.name ? (
                                <Heading>{store.user.name}</Heading>
                            ) : (
                                <Skeleton
                                    color={styles.colors.gray}
                                    width={150}
                                    height={20}
                                />
                            )}
                            {store.user.name ? (
                                <Text>
                                    {store.user.role === UserRole.USER
                                        ? "Пользователь"
                                        : "Администратор"}
                                </Text>
                            ) : (
                                <Skeleton
                                    color={styles.colors.gray}
                                    width={100}
                                    height={15}
                                />
                            )}
                        </Pane>
                        <Pane display="flex" gap={10}>
                            {store.user.role === UserRole.ADMIN && (
                                <Tooltip
                                    content="Управление"
                                    statelessProps={{
                                        backgroundColor: styles.colors.darkBlue,
                                        display: isDesktop ? null : "none",
                                    }}
                                >
                                    <SlidersHorizontal
                                        size={20}
                                        weight="bold"
                                        color={styles.colors.darkBlue}
                                        style={{
                                            borderRadius: 8,
                                            padding: 15,
                                            cursor: "pointer",
                                        }}
                                        className="control-button"
                                        onClick={() => {
                                            toggleSideView();
                                            setSideViewData(
                                                "settings",
                                                "Управление"
                                            );
                                        }}
                                    />
                                </Tooltip>
                            )}
                            <Tooltip
                                content="Выйти"
                                statelessProps={{
                                    backgroundColor: styles.colors.darkBlue,
                                    display: isDesktop ? null : "none",
                                }}
                            >
                                <SignOut
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                    style={{
                                        borderRadius: 8,
                                        padding: 15,
                                        cursor: "pointer",
                                    }}
                                    className="control-button"
                                    onClick={() => {
                                        store.setToken("");
                                        store.setUser({
                                            name: "",
                                            email: "",
                                            token: "",
                                            role: UserRole.UNKNOWN,
                                            photo: "",
                                        });
                                    }}
                                />
                            </Tooltip>
                        </Pane>
                    </Pane>
                )}

                {!store.token && (
                    <Pane
                        position="fixed"
                        right={isMini ? 0 : 25}
                        top={isMini ? 0 : 25}
                        width={isMini ? "100vw" : null}
                        display="flex"
                        gap={25}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={styles.colors.white}
                        padding={15}
                        borderRadius={isMini ? 0 : 8}
                        cursor="pointer"
                        onClick={() => {
                            toggleSideView();
                            setSideViewData("auth", "Авторизация");
                        }}
                    >
                        <Strong>
                            Хотите <ins>войти в аккаунт</ins>?
                        </Strong>
                    </Pane>
                )}

                <Pane
                    position="fixed"
                    left={isMini ? 0 : 25}
                    top={isMini ? 50 : 25}
                    width={isMini ? "100vw" : 400}
                    display="flex"
                    flexDirection="column"
                    gap={25}
                >
                    <Pane
                        width="100%"
                        display="flex"
                        gap={isMini ? 25 : 10}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={styles.colors.white}
                        padding={15}
                        borderRadius={isMini ? 0 : 8}
                    >
                        <TextInput
                            width="100%"
                            placeholder="Поиск по адресам..."
                            value={searchInput}
                            onChange={(e: any) => {
                                setSearchInput(e.target.value);
                                if (addresses.length > 0) setAddresses([]);
                            }}
                        />
                        <Button
                            appearance="primary"
                            intent={addresses.length === 0 ? "none" : "danger"}
                            onClick={() => {
                                if (addresses.length === 0)
                                    api.map
                                        .lookup(searchInput)
                                        .then(({ items }) =>
                                            setAddresses(items)
                                        )
                                        .catch(() =>
                                            toaster.danger(
                                                "Что-то пошло не так. Попробуйте ещё раз",
                                                { duration: 1 }
                                            )
                                        );
                                else {
                                    setAddresses([]);
                                    setSearchInput("");
                                }
                            }}
                        >
                            {addresses.length === 0 ? "Найти" : "Стереть"}
                        </Button>
                    </Pane>
                    <Pane display="flex" flexDirection="column" gap={5}>
                        {addresses.map((place) => (
                            <Pane
                                backgroundColor={styles.colors.white}
                                padding={15}
                                borderRadius={isMini ? 0 : 8}
                                cursor="pointer"
                                onClick={() => {
                                    setViewState((old) => ({
                                        ...old,
                                        longitude: place.lng,
                                        latitude: place.lat,
                                    }));
                                }}
                            >
                                {place.label}
                            </Pane>
                        ))}
                    </Pane>
                </Pane>

                {!isMini && (
                    <Pane
                        position="fixed"
                        right={25}
                        bottom={25}
                        display="flex"
                        gap={15}
                        alignItems="center"
                        backgroundColor={styles.colors.white}
                        padding={15}
                        borderRadius={8}
                        cursor="pointer"
                        className="share-map"
                        onClick={() => {
                            toggleSideView();
                            setSideViewData("share-map", "Поделиться картой");
                        }}
                    >
                        <Share
                            size={20}
                            weight="bold"
                            color={styles.colors.darkBlue}
                        />
                        <Strong>Поделиться картой</Strong>
                    </Pane>
                )}
            </Portal>
        </Pane>
    );
}
