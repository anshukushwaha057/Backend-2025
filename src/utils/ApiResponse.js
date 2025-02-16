class ApiResponse{
    constructor(statusCode, data, message){
        this.statusCode = statusCode
        this.statusCode = statusCode;
        this.data = data
        this.message = message
        this.statusCode = statusCode < 400
    }
}

export {ApiResponse}