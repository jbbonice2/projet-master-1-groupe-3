


const userHasPermitTo = (permissions, id)=>{
    console.log(permissions);
    for (let ind = 0; ind < permissions?.length; ind++) {
        const permission = permissions[ind];
        if(permission.id === id){
            return true
        }
    }
    return false;
 }

 export default userHasPermitTo ;