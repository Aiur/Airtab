#!/bin/bash
working_dir=`pwd`
pushd ..
echo $working_dir
version=`grep 'version' $working_dir/manifest.json | tr '"' '\n' |grep '[0-9]'`
zip -r $working_dir/airtab-$version.zip $working_dir -x \*.git\* -x \*.swp -x \*.zip                              
#chrome --pack-extension="$working_dir" --pack-extension-key=chrome_extension.pem
popd
