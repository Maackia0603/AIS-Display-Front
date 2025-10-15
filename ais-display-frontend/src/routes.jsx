import Home from "./views/Home.jsx";
import GeoJsonDisplay from "./views/GeoJsonDisplay.jsx";

// 编写路由表 
export const routes = [
    {
        path: "/",
        element: <Home/>,
    },
    {
        path: "/home",
        element: <Home/>,
    },    
    {
        path: "/geojsondisplay",
        element: <GeoJsonDisplay />,
    },
];
