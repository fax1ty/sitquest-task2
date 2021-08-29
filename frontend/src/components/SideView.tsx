import { useLocation } from "@reach/router";
import {
    FormField,
    Heading,
    Pane,
    Paragraph,
    SideSheet,
    Strong,
    Table,
    Text,
    Textarea,
    TextInput,
    toaster,
} from "evergreen-ui";
import { observer } from "mobx-react";
import {
    ArrowLeft,
    Eye,
    FileArrowUp,
    FileMinus,
    FilePlus,
    MapPin,
    Polygon,
    SignIn,
    Stack,
    Trash,
    UserPlus,
    X,
} from "phosphor-react";
import { useState } from "react";
import {
    EReCaptchaV2Size,
    EReCaptchaV2Theme,
    ReCaptchaV2,
} from "react-recaptcha-x";
import { useMediaQuery } from "react-responsive";
import api from "../api";
import store from "../store";
import styles from "../styles";

interface Props {
    special?:
        | "settings"
        | "add-marker"
        | "add-layer"
        | "share-map"
        | "auth"
        | "register"
        | "";
    title: string;
    description?: string;
    isShown: boolean;
    onClose: () => void;
}

export default observer(
    ({ isShown, onClose, title, description, special }: Props) => {
        const isMini = useMediaQuery({ query: "(max-width: 1224px)" });

        const [inputEmail, setInputEmail] = useState("");
        const [inputPassword, setInputPassword] = useState("");
        const [inputName, setInputName] = useState("");

        const [newMarkerName, setNewMarkerName] = useState("");
        const [newMarkerUrl, setNewMarkerUrl] = useState("");
        const [newMarkerPosition, setNewMarkerPosition] = useState(
            new Array<number>()
        );

        const [adminSelectedLayerName, setAdminSelectedLayerName] =
            useState("");
        const [adminSelectedLayerDescription, setAdminSelectedLayerDescrition] =
            useState("");
        const [adminSelectedLayerJSON, setAdminSelectedLayerJSON] =
            useState("");
        const [adminSelectedLayerId, setAdminSelectedLayerId] = useState("");

        const [authPage, setAuthPage] = useState<"login" | "register">("login");

        const location = useLocation();

        return (
            <SideSheet
                isShown={isShown}
                onCloseComplete={() => {
                    store.setSideViewAdminPage("");
                    onClose();
                    store.removeVirtualMarkers();
                    setNewMarkerName("");
                    setNewMarkerUrl("");
                    setNewMarkerPosition([]);
                }}
                shouldCloseOnOverlayClick={false}
                onBeforeClose={() => store.setGoogleTestPassed(false)}
            >
                <Pane
                    padding={40}
                    display="flex"
                    flexDirection="column"
                    maxWidth="100vw"
                    gap={25}
                >
                    <Heading size={900}>{title}</Heading>

                    {!special && (
                        <Pane display="flex" flexDirection="column" gap={15}>
                            <Paragraph>{description}</Paragraph>
                        </Pane>
                    )}

                    {special === "settings" && (
                        <Pane display="flex">
                            {store.sideViewAdminPage === "" && (
                                <Pane
                                    display="flex"
                                    flexDirection="column"
                                    gap={25}
                                >
                                    <Pane
                                        display="flex"
                                        gap={25}
                                        flexDirection="row"
                                        padding={25}
                                        borderRadius={8}
                                        className="control-button"
                                        cursor="pointer"
                                        alignItems="center"
                                        onClick={() => {
                                            // setAdminPage('markers');
                                        }}
                                    >
                                        <MapPin
                                            color={styles.colors.white}
                                            size={25}
                                            weight="bold"
                                            style={{
                                                backgroundColor:
                                                    styles.colors.red,
                                                padding: 15,
                                                borderRadius: 8,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Pane
                                            display="flex"
                                            flexDirection="column"
                                            gap={10}
                                        >
                                            <Heading>
                                                Модерация маркеров
                                            </Heading>
                                            <Text>
                                                Здесь можно утвердить новые или
                                                удалить существующие маркеры
                                                (места)
                                            </Text>
                                        </Pane>
                                    </Pane>

                                    <Pane
                                        display="flex"
                                        gap={25}
                                        flexDirection="row"
                                        padding={25}
                                        borderRadius={8}
                                        className="control-button"
                                        cursor="pointer"
                                        alignItems="center"
                                        onClick={() => {
                                            store.setSideViewAdminPage(
                                                "layers"
                                            );
                                        }}
                                    >
                                        <Stack
                                            color={styles.colors.white}
                                            size={25}
                                            weight="bold"
                                            style={{
                                                backgroundColor:
                                                    styles.colors.red,
                                                padding: 15,
                                                borderRadius: 8,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Pane
                                            display="flex"
                                            flexDirection="column"
                                            gap={10}
                                        >
                                            <Heading>Управление слоями</Heading>
                                            <Text>
                                                Районы, <del>кварталы</del>,
                                                жилые массивы
                                            </Text>
                                        </Pane>
                                    </Pane>
                                </Pane>
                            )}

                            {store.sideViewAdminPage === "markers" && (
                                <Pane
                                    display="flex"
                                    width="100%"
                                    flexDirection="column"
                                    gap={25}
                                >
                                    <Table>
                                        <Table.Head>
                                            <Table.SearchHeaderCell placeholder="Название" />
                                            <Table.TextHeaderCell>
                                                URL
                                            </Table.TextHeaderCell>
                                            <Table.TextHeaderCell>
                                                Координаты
                                            </Table.TextHeaderCell>
                                        </Table.Head>
                                        <Table.Body height={240}>
                                            {store.soretedMarkers.map((m) => (
                                                <Table.Row
                                                    key={m.id}
                                                    isSelectable
                                                    onSelect={() =>
                                                        store.setSideViewAdminSelectedMarker(
                                                            m
                                                        )
                                                    }
                                                    intent={
                                                        m.reviewed
                                                            ? "success"
                                                            : "danger"
                                                    }
                                                >
                                                    <Table.TextCell>
                                                        {m.name}
                                                    </Table.TextCell>
                                                    <Table.TextCell>
                                                        {m.url}
                                                    </Table.TextCell>
                                                    <Table.TextCell>{`Lat: ${m.coordinates[0].toFixed(
                                                        3
                                                    )} / Lng: ${m.coordinates[1].toFixed(
                                                        3
                                                    )}`}</Table.TextCell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>

                                    {store.sideViewAdminSelectedMarker && (
                                        <Pane
                                            display="flex"
                                            gap={15}
                                            alignItems="center"
                                            padding={15}
                                            borderRadius={8}
                                            cursor="pointer"
                                            onClick={() => {
                                                api.map
                                                    .reviewMarker(
                                                        store.token,
                                                        (
                                                            store.sideViewAdminSelectedMarker as any
                                                        ).id,
                                                        !store
                                                            .sideViewAdminSelectedMarker
                                                            ?.reviewed
                                                    )
                                                    .then((marker) => {
                                                        store.updateMarker(
                                                            marker
                                                        );
                                                    })
                                                    .catch(() => {
                                                        toaster.danger(
                                                            "Не смогли обновить маркер. Попробуйте ещё раз",
                                                            { duration: 1 }
                                                        );
                                                    });
                                            }}
                                            className="control-button"
                                        >
                                            <Eye
                                                size={20}
                                                weight="bold"
                                                color={styles.colors.darkBlue}
                                            />
                                            <Strong>
                                                {store
                                                    .sideViewAdminSelectedMarker
                                                    ?.reviewed
                                                    ? "Убрать"
                                                    : "Поставить"}{" "}
                                                отметку "Просмотрено"
                                            </Strong>
                                        </Pane>
                                    )}
                                    {store.sideViewAdminSelectedMarker && (
                                        <Pane
                                            display="flex"
                                            gap={15}
                                            alignItems="center"
                                            padding={15}
                                            borderRadius={8}
                                            cursor="pointer"
                                            onClick={() => {
                                                api.map
                                                    .removeMarker(
                                                        store.token,
                                                        (
                                                            store.sideViewAdminSelectedMarker as any
                                                        ).id
                                                    )
                                                    .catch(() => {
                                                        toaster.danger(
                                                            "Не смогли удалить маркер. Попробуйте ещё раз",
                                                            { duration: 1 }
                                                        );
                                                    });
                                            }}
                                            className="control-button"
                                        >
                                            <Trash
                                                size={20}
                                                weight="bold"
                                                color={styles.colors.darkBlue}
                                            />
                                            <Strong>Удалить маркер</Strong>
                                        </Pane>
                                    )}

                                    <Pane
                                        display="flex"
                                        gap={15}
                                        alignItems="center"
                                        padding={15}
                                        borderRadius={8}
                                        cursor="pointer"
                                        onClick={() => {
                                            store.setSideViewAdminPage("");
                                        }}
                                        className="control-button"
                                    >
                                        <ArrowLeft
                                            size={20}
                                            weight="bold"
                                            color={styles.colors.darkBlue}
                                        />
                                        <Strong>В главное меню</Strong>
                                    </Pane>
                                </Pane>
                            )}
                        </Pane>
                    )}

                    {store.sideViewAdminPage === "layers" && (
                        <Pane
                            display="flex"
                            width="100%"
                            flexDirection="column"
                            gap={25}
                        >
                            <Pane
                                display="flex"
                                flexDirection="column"
                                gap={25}
                            >
                                <Pane
                                    display="flex"
                                    gap={25}
                                    flexDirection="row"
                                    padding={10}
                                    borderRadius={8}
                                    className="control-button"
                                    cursor="pointer"
                                    alignItems="center"
                                    onClick={() => {
                                        store.setSideViewAdminPage("add-layer");
                                    }}
                                >
                                    <FilePlus
                                        color={styles.colors.white}
                                        size={25}
                                        weight="bold"
                                        style={{
                                            backgroundColor: styles.colors.red,
                                            padding: 15,
                                            borderRadius: 8,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Pane
                                        display="flex"
                                        flexDirection="column"
                                        gap={10}
                                    >
                                        <Heading>Добавить новый слой</Heading>
                                    </Pane>
                                </Pane>
                                {store.layers.features.map((f) => (
                                    <Pane
                                        key={f.properties.id}
                                        display="flex"
                                        gap={25}
                                        flexDirection="row"
                                        padding={10}
                                        borderRadius={8}
                                        className="control-button"
                                        cursor="pointer"
                                        alignItems="center"
                                        onClick={() => {
                                            store.setSideViewAdminPage(
                                                "edit-layer"
                                            );
                                            setAdminSelectedLayerName(
                                                f.properties.name
                                            );
                                            setAdminSelectedLayerDescrition(
                                                f.properties.description
                                            );
                                            setAdminSelectedLayerId(
                                                f.properties.id
                                            );
                                            setAdminSelectedLayerJSON(
                                                JSON.stringify(f.geometry)
                                            );
                                        }}
                                    >
                                        <Polygon
                                            color={styles.colors.white}
                                            size={25}
                                            weight="bold"
                                            style={{
                                                backgroundColor:
                                                    styles.colors.red,
                                                padding: 15,
                                                borderRadius: 8,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Pane
                                            display="flex"
                                            flexDirection="column"
                                            gap={10}
                                        >
                                            <Heading>
                                                {f.properties.name}
                                            </Heading>
                                        </Pane>
                                    </Pane>
                                ))}
                            </Pane>

                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    store.setSideViewAdminPage("");
                                }}
                                className="control-button"
                            >
                                <ArrowLeft
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>В главное меню</Strong>
                            </Pane>
                        </Pane>
                    )}

                    {special === "add-marker" && (
                        <Pane display="flex" flexDirection="column" gap={25}>
                            <FormField
                                label={false}
                                display="flex"
                                flexDirection="column"
                                gap={25}
                            >
                                <TextInput
                                    value={newMarkerName}
                                    required={true}
                                    onChange={(e: any) =>
                                        setNewMarkerName(e.target.value)
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder="Название"
                                />
                                <TextInput
                                    value={newMarkerUrl}
                                    required={true}
                                    onChange={(e: any) =>
                                        setNewMarkerUrl(e.target.value)
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder="URL"
                                />
                            </FormField>
                            <Pane
                                display="flex"
                                width="100%"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    api.map
                                        .addMarker(
                                            store.token,
                                            newMarkerName,
                                            newMarkerUrl,
                                            newMarkerPosition
                                        )
                                        .then(({ name, url, coordinates }) => {
                                            onClose();
                                            store.addMarker({
                                                id: "newMarker",
                                                name,
                                                url,
                                                coordinates,
                                                reviewed: false,
                                            });
                                        })
                                        .catch((e) => console.error(e));
                                }}
                                className="control-button"
                            >
                                <FilePlus
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>Добавить маркер</Strong>
                            </Pane>
                        </Pane>
                    )}

                    {store.sideViewAdminPage === "add-layer" && (
                        <Pane display="flex" flexDirection="column" gap={25}>
                            <FormField
                                label={false}
                                display="flex"
                                flexDirection="column"
                                gap={25}
                            >
                                <TextInput
                                    value={adminSelectedLayerName}
                                    required={true}
                                    onChange={(e: any) =>
                                        setAdminSelectedLayerName(
                                            e.target.value
                                        )
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder="Название"
                                />
                                <Textarea
                                    value={adminSelectedLayerDescription}
                                    required={true}
                                    onChange={(e: any) =>
                                        setAdminSelectedLayerDescrition(
                                            e.target.value
                                        )
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder="Описание"
                                />
                                <Textarea
                                    value={adminSelectedLayerJSON}
                                    required={true}
                                    onChange={(e: any) =>
                                        setAdminSelectedLayerJSON(
                                            e.target.value
                                        )
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder='GeoJSON. { "type": "Polygon", "coordinates": [] }'
                                />
                            </FormField>
                            <Pane
                                display="flex"
                                width="100%"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    api.map
                                        .addLayer(
                                            store.token,
                                            adminSelectedLayerName,
                                            adminSelectedLayerDescription,
                                            adminSelectedLayerJSON
                                        )
                                        .then(() => {
                                            setAdminSelectedLayerDescrition("");
                                            setAdminSelectedLayerName("");
                                            setAdminSelectedLayerJSON("");
                                            toaster.success(
                                                "Всё готово. Новый слой создан",
                                                { duration: 1 }
                                            );
                                        })
                                        .catch((e) => {
                                            toaster.danger(
                                                "Что-то пошло не так. Попробуйте ещё раз",
                                                { duration: 1 }
                                            );
                                        });
                                }}
                                className="control-button"
                            >
                                <FilePlus
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>Добавить слой</Strong>
                            </Pane>
                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    store.setSideViewAdminPage("layers");
                                }}
                                className="control-button"
                            >
                                <ArrowLeft
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>К управлению слоями</Strong>
                            </Pane>
                        </Pane>
                    )}

                    {store.sideViewAdminPage === "edit-layer" && (
                        <Pane display="flex" flexDirection="column" gap={25}>
                            <FormField
                                label={false}
                                display="flex"
                                flexDirection="column"
                                gap={25}
                            >
                                <TextInput
                                    value={adminSelectedLayerName}
                                    required={true}
                                    onChange={(e: any) =>
                                        setAdminSelectedLayerName(
                                            e.target.value
                                        )
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder="Название"
                                />
                                <Textarea
                                    value={adminSelectedLayerDescription}
                                    required={true}
                                    onChange={(e: any) =>
                                        setAdminSelectedLayerDescrition(
                                            e.target.value
                                        )
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder="Описание"
                                />
                                <Textarea
                                    value={adminSelectedLayerJSON}
                                    required={true}
                                    onChange={(e: any) =>
                                        setAdminSelectedLayerJSON(
                                            e.target.value
                                        )
                                    }
                                    width="100%"
                                    height={40}
                                    placeholder='GeoJSON. { "type": "Polygon", "coordinates": [] }'
                                />
                            </FormField>
                            <Pane
                                display="flex"
                                width="100%"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    api.map
                                        .updateLayer(
                                            store.token,
                                            adminSelectedLayerId,
                                            adminSelectedLayerName,
                                            adminSelectedLayerDescription,
                                            adminSelectedLayerJSON
                                        )
                                        .then(() => {
                                            toaster.success(
                                                "Слой был успешно обновлён",
                                                { duration: 1 }
                                            );
                                        })
                                        .catch((e) => console.error(e));
                                }}
                                className="control-button"
                            >
                                <FileArrowUp
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>Обновить слой</Strong>
                            </Pane>
                            <Pane
                                display="flex"
                                width="100%"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    api.map
                                        .removeLayer(
                                            store.token,
                                            adminSelectedLayerId
                                        )
                                        .then(() => {
                                            store.setSideViewAdminPage(
                                                "layers"
                                            );
                                            setAdminSelectedLayerId("");
                                            setAdminSelectedLayerName("");
                                            setAdminSelectedLayerDescrition("");
                                            setAdminSelectedLayerJSON("");
                                            toaster.success(
                                                "Слой был успешно удалён",
                                                { duration: 1 }
                                            );
                                        })
                                        .catch((e) => console.error(e));
                                }}
                                className="control-button"
                            >
                                <FileMinus
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>Удалить слой</Strong>
                            </Pane>
                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => {
                                    store.setSideViewAdminPage("layers");
                                    setAdminSelectedLayerId("");
                                    setAdminSelectedLayerName("");
                                    setAdminSelectedLayerDescrition("");
                                    setAdminSelectedLayerJSON("");
                                }}
                                className="control-button"
                            >
                                <ArrowLeft
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>К управлению слоями</Strong>
                            </Pane>
                        </Pane>
                    )}

                    {special === "share-map" && (
                        <Pane display="flex" flexDirection="column" gap={25}>
                            <Paragraph>
                                Пока доступен лишь один способ - вставить карту
                                на свой сайт. Скопируйте код из поля снизу и
                                вставьте его в удобное место
                            </Paragraph>
                            <Textarea>{`<iframe width="560" height="315" src="${location.host}/?embed=true" title="Лучшая карта на свете" frameborder="0" allowfullscreen></iframe>`}</Textarea>
                        </Pane>
                    )}

                    {special === "auth" && authPage === "login" && (
                        <Pane display="flex" flexDirection="column" gap={25}>
                            <FormField
                                label={false}
                                display="flex"
                                flexDirection="column"
                                gap={25}
                            >
                                <TextInput
                                    value={inputEmail}
                                    required={true}
                                    onChange={(e: any) =>
                                        setInputEmail(e.target.value)
                                    }
                                    type="email"
                                    width="100%"
                                    height={40}
                                    placeholder="E-mail"
                                />
                                <TextInput
                                    value={inputPassword}
                                    required={true}
                                    onChange={(e: any) =>
                                        setInputPassword(e.target.value)
                                    }
                                    type="password"
                                    width="100%"
                                    height={40}
                                    placeholder="Пароль"
                                />
                            </FormField>
                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                backgroundColor={
                                    store.googleTestPassed
                                        ? null
                                        : styles.colors.blue
                                }
                                cursor={
                                    store.googleTestPassed
                                        ? "pointer"
                                        : "not-allowed"
                                }
                                onClick={() => {
                                    if (!store.googleTestPassed) return;
                                    api.users
                                        .login(inputEmail, inputPassword)
                                        .then(
                                            ({ token, email, name, role }) => {
                                                store.setToken(token);
                                                store.setUser({
                                                    token,
                                                    email,
                                                    name,
                                                    photo: "",
                                                    role,
                                                });
                                                store.setGoogleTestPassed(
                                                    false
                                                );
                                                onClose();
                                            }
                                        )
                                        .catch((e) => console.error(e));
                                }}
                                className={
                                    store.googleTestPassed
                                        ? "control-button"
                                        : undefined
                                }
                                aria-disabled={!store.googleTestPassed}
                            >
                                <SignIn
                                    size={20}
                                    weight="bold"
                                    color={
                                        store.googleTestPassed
                                            ? styles.colors.darkBlue
                                            : styles.colors.white
                                    }
                                />
                                <Strong
                                    color={
                                        store.googleTestPassed
                                            ? null
                                            : styles.colors.white
                                    }
                                >
                                    Войти
                                </Strong>
                            </Pane>
                            <ReCaptchaV2
                                callback={(e) => {
                                    if (e === false)
                                        store.setGoogleTestPassed(false);
                                    else store.setGoogleTestPassed(true);
                                }}
                                theme={EReCaptchaV2Theme.Light}
                                size={EReCaptchaV2Size.Normal}
                                tabindex={0}
                                style={{ maxWidth: "90vw" }}
                            />
                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => setAuthPage("register")}
                                className="control-button"
                            >
                                <UserPlus
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>Регистрация</Strong>
                            </Pane>
                        </Pane>
                    )}

                    {special === "auth" && authPage === "register" && (
                        <Pane display="flex" flexDirection="column" gap={25}>
                            <FormField
                                label={false}
                                display="flex"
                                flexDirection="column"
                                gap={25}
                            >
                                <TextInput
                                    value={inputName}
                                    required={true}
                                    onChange={(e: any) =>
                                        setInputName(e.target.value)
                                    }
                                    type="email"
                                    width="100%"
                                    height={40}
                                    placeholder="Имя"
                                />
                                <TextInput
                                    value={inputEmail}
                                    required={true}
                                    onChange={(e: any) =>
                                        setInputEmail(e.target.value)
                                    }
                                    type="email"
                                    width="100%"
                                    height={40}
                                    placeholder="E-mail"
                                />
                                <TextInput
                                    value={inputPassword}
                                    required={true}
                                    onChange={(e: any) =>
                                        setInputPassword(e.target.value)
                                    }
                                    type="password"
                                    width="100%"
                                    height={40}
                                    placeholder="Пароль"
                                />
                            </FormField>
                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                backgroundColor={
                                    store.googleTestPassed
                                        ? null
                                        : styles.colors.blue
                                }
                                cursor={
                                    store.googleTestPassed
                                        ? "pointer"
                                        : "not-allowed"
                                }
                                onClick={() => {
                                    if (!store.googleTestPassed) return;
                                    api.users
                                        .register(
                                            inputEmail,
                                            inputPassword,
                                            inputName
                                        )
                                        .then(
                                            ({ token, email, name, role }) => {
                                                store.setToken(token);
                                                store.setUser({
                                                    token,
                                                    email,
                                                    name,
                                                    photo: "",
                                                    role,
                                                });
                                                store.setGoogleTestPassed(
                                                    false
                                                );
                                                onClose();
                                            }
                                        )
                                        .catch((e) => console.error(e));
                                }}
                                className={
                                    store.googleTestPassed
                                        ? "control-button"
                                        : undefined
                                }
                                aria-disabled={!store.googleTestPassed}
                            >
                                <SignIn
                                    size={20}
                                    weight="bold"
                                    color={
                                        store.googleTestPassed
                                            ? styles.colors.darkBlue
                                            : styles.colors.white
                                    }
                                />
                                <Strong
                                    color={
                                        store.googleTestPassed
                                            ? null
                                            : styles.colors.white
                                    }
                                >
                                    Зарегистрироваться
                                </Strong>
                            </Pane>
                            <ReCaptchaV2
                                callback={(e) => {
                                    if (e === false)
                                        store.setGoogleTestPassed(false);
                                    else store.setGoogleTestPassed(true);
                                }}
                                theme={EReCaptchaV2Theme.Light}
                                size={EReCaptchaV2Size.Normal}
                                tabindex={0}
                                style={{ maxWidth: "90vw" }}
                            />
                            <Pane
                                display="flex"
                                gap={15}
                                alignItems="center"
                                padding={15}
                                borderRadius={8}
                                cursor="pointer"
                                onClick={() => setAuthPage("login")}
                                className="control-button"
                            >
                                <ArrowLeft
                                    size={20}
                                    weight="bold"
                                    color={styles.colors.darkBlue}
                                />
                                <Strong>Назад к входу</Strong>
                            </Pane>
                        </Pane>
                    )}

                    {isMini && (
                        <Pane
                            display="flex"
                            gap={15}
                            alignItems="center"
                            marginTop={25}
                            padding={15}
                            borderRadius={8}
                            cursor="pointer"
                            onClick={onClose}
                            className="control-button"
                        >
                            <X
                                size={20}
                                weight="bold"
                                color={styles.colors.darkBlue}
                            />
                            <Strong>Закрыть окошечко</Strong>
                        </Pane>
                    )}
                </Pane>
            </SideSheet>
        );
    }
);
