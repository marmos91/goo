/**
 * Class that represents an Address.
 * @author Marco Moschettini
 * @version 0.0.1
 */
export default class Address
{
    private _address: string;
    private _port: number;
    private _family: string;

    /**
     * The constructor
     * @param address {string} The ip address
     * @param port {number} The port
     * @param family
     */
    constructor(address: string, port: number, family = 'ipv4')
    {
        this._address = address;
        this._port = port;
        this._family = family;
    }

    /**
     * Method used to deserialize a previously serialized address and to return a new Address instance
     * @param address {_address: string, _port: number, _family; string}: The serialized address to be deserialized
     * @returns {Address}
     */
    public static refresh(address: {_address: string, _port: number, _family; string})
    {
        if(address._address && address._port)
            return new Address(address._address, address._port, address._family);
    }

    // region getters
    public get address(): string
    {
        return this._address;
    }

    public get port(): number
    {
        return this._port;
    }
    // endregion
}