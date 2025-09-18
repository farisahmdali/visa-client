import axios from "axios";

const instance = axios.create({
    baseURL: "https://api.atlys.com/api/v3/countries?citizenship=GB&residence=GB&pincode=641020&isEnterprise=false",
});

export default instance;