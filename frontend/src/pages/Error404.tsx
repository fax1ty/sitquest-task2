import { Pane, Heading } from "evergreen-ui";
import { Link } from "@reach/router";

export default function Cashback(props: { default: boolean }) {
    return (
        <Pane
            display="flex"
            flex={1}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={25}
        >
            <Heading
                style={{
                    fontSize: "4.5rem",
                    lineHeight: "5rem",
                    marginTop: 55,
                    textTransform: "uppercase",
                    textAlign: "center",
                }}
                color="#0057A4"
            >
                404
            </Heading>
            <Link
                to={`${process.env.PUBLIC_URL}/`}
                style={{ textDecoration: "none" }}
            >
                <div
                    style={{
                        paddingInline: 25,
                        background: "#c02722",
                        height: 40,
                        borderRadius: 40 / 2,
                        display: "flex",
                    }}
                >
                    <span
                        style={{
                            textTransform: "uppercase",
                            fontSize: 15,
                            color: "white",
                            alignSelf: "center",
                        }}
                    >
                        {"На главную"}
                    </span>
                </div>
            </Link>
        </Pane>
    );
}
