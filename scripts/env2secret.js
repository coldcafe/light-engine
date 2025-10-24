function parseEnvString(str){
  var obj={};
  str.split("\n").forEach(function(l){
    if(l.indexOf("=")===(l.length-1)&&l.trim().length>=2){
      obj[l.substring(0,l.length-1).trim()]="";
      return;
    }
    
    var kvMatches = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if(!kvMatches||!kvMatches[2]) return;
    var key = kvMatches[1], value = kvMatches[2];
    if(key&&value&&key.length&&value.length){
      if(value.length>2&&value.charAt(0)==='"'&&value.charAt(value.length-1)==='"'){
        value=value.substring(1,value.length-1).replace(/\\n/gm,"\n");
      }else if(value.length>2&&value.charAt(0)==='\''&&value.charAt(value.length-1)==='\''){
        value=value.substring(1,value.length-1);
      }
      obj[key]=value.trim();
    }
  })
  return obj;
}

function genK8SSecret(namespace, name, obj){
  return "apiVersion: v1\nkind: Secret\nmetadata:\n  name: "+name+"\n  namespace: "+namespace+"\ntype: Opaque\ndata:\n" + Object.keys(obj).map(function(key){
    return "  "+key+": "+JSON.stringify(Buffer.from(obj[key]+"", 'utf8').toString('base64'))
  }).join("\n");
}

function failError(errorMessage){
  console.error("ERROR: ",errorMessage);
  process.exit(1);
}

exports.run = function(namespace, secretName, envStr, envKeys) {
  var envObj = parseEnvString(envStr);
  if (envKeys) {
    envKeys.forEach(k => {
      if (envObj[k] === undefined) {
        envObj[k] = ""
      }
    })
  }
  if(Object.keys(envObj).length===0){
    return failError("Invalid or empty env input!");
  }
  return genK8SSecret(namespace, secretName, envObj);
}

exports.getEnvKeys = function getEnvKeys(envStr) {
  var envObj = parseEnvString(envStr);
  return Object.keys(envObj)
}