import axios from "axios";
import { Method } from "../../../lib/Method";
import { MethodError } from "../../../lib/MethodError";

interface MethodBody {
    search: string;
}

interface HEREPlace {
    title: string;
    id: string;
    resultType: "street" | "";
    address: {
        label: string;
    };
    position: {
        lat: number;
        lng: number;
    };
    distance: number;
    mapView: {
        west: number;
        south: number;
        east: number;
        north: number;
    };
    highlights: {
        title: [
            {
                start: number;
                end: number;
            }
        ];
        address: {
            label: [
                {
                    start: number;
                    end: number;
                }
            ];
        };
    };
}

interface Place {
    label: string;
    lat: number;
    lng: number;
}

interface MethodResponse {
    items: Array<Place>;
}

export default new Method<MethodBody, MethodResponse>(
    ({ search }) =>
        new Promise(async (ok, err) => {
            if ([search].filter((i) => typeof i != "string").length > 0)
                return err(new MethodError(400, "BadRequest"));
            try {
                const { data } = await axios.get<{ items: Array<HEREPlace> }>(
                    `https://autosuggest.search.hereapi.com/v1/autosuggest?${new URLSearchParams(
                        {
                            q: search,
                            at: "53.20087,50.19065",
                            apiKey: process.env.HERE_TOKEN,
                            limit: "3",
                        }
                    ).toString()}`,
                    {
                        headers: {
                            "Accept-Language": "ru-RU",
                        },
                    }
                );
                return ok({
                    items: data.items.map((place) => ({
                        label: place.address.label,
                        lat: place.position.lat,
                        lng: place.position.lng,
                    })),
                });
            } catch (e) {
                console.log(e);
                return err(new MethodError(500, "InternalError"));
            }
        })
);
