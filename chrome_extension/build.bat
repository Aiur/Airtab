pushd ..
set extensiondir=%CD%
chrome --pack-extension=%extensiondir%\chrome_extension --pack-extension-key=%extensiondir%\chrome_extension.pem

move chrome_extension.crx server\airtab.crx
popd 
