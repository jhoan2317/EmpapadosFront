import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";
import logo from "../assets/react.svg";


export default function Landing() {
    const navigate = useNavigate()
    const [fadeOut, setFadeOut] = useState(false);


    useEffect(() => {
        const fadetimer = setTimeout(() => {
            setFadeOut(true);
        }, 2500);

        const redirectTimer = setTimeout(() => {
            navigate("/home");
        }, 3000);

        return () => {
            clearTimeout(fadetimer);
            clearTimeout(redirectTimer);
        };
    }, [navigate]);

    return (
        <div className={`landing-container ${fadeOut ? "fade-out" : ""}`}>
            <img src={logo} alt="react" className="landing-react" />
        </div>
    );
}
