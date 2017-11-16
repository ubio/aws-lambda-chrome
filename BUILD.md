# Build

## Chrome

Create EC2 instance:

    - AMI: amzn-ami-hvm-2017.09.0.20170930-x86_64-gp2 (Latest community Amazon Linux)
    - Instance type: c4.4xlarge
    - Storage: 30GB

SSH and run:

```bash
sudo -i
printf "LANG=en_US.utf-8\nLC_ALL=en_US.utf-8" >> /etc/environment
yum install -y git redhat-lsb python bzip2 tar pkgconfig atk-devel alsa-lib-devel bison binutils brlapi-devel bluez-libs-devel bzip2-devel cairo-devel cups-devel dbus-devel dbus-glib-devel expat-devel fontconfig-devel freetype-devel gcc-c++ GConf2-devel glib2-devel glibc.i686 gperf glib2-devel gtk2-devel gtk3-devel java-1.*.0-openjdk-devel libatomic libcap-devel libffi-devel libgcc.i686 libgnome-keyring-devel libjpeg-devel libstdc++.i686 libX11-devel libXScrnSaver-devel libXtst-devel libxkbcommon-x11-devel ncurses-compat-libs nspr-devel nss-devel pam-devel pango-devel pciutils-devel pulseaudio-libs-devel zlib.i686 httpd mod_ssl php php-cli python-psutil wdiff --enablerepo=epel
```

Ingore yum warnings/errors.

### Checkout Chromium sources

```bash
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
echo "export PATH=$PATH:$HOME/depot_tools" >> ~/.bash_profile
source ~/.bash_profile
mkdir Chromium && cd Chromium
fetch --no-history chromium
cd src
```

Note: Chrome version is available in `./chrome/VERSION`.

### Patch few things

You need to fix few things in Chromium source to make it work in a sandboxed environment of Lambda.

Edit `./base/files/file_util_posix.cc`:

- find `bool GetShmemTempDir`
- set `use_dev_shm = false;` before it's checked:

```c
bool GetShmemTempDir(bool executable, FilePath* path) {
#if defined(OS_LINUX) || defined(OS_AIX)
  bool use_dev_shm = true;
  if (executable) {
    static const bool s_dev_shm_executable = DetermineDevShmExecutable();
    use_dev_shm = s_dev_shm_executable;
  }
  // <------------ here
  use_dev_shm = false;
  if (use_dev_shm) {
    *path = FilePath("/dev/shm");
    return true;
  }
#endif
  return GetTempDir(path);
}

```

Edit `./content/browser/sandbox_ipc_linux.cc`:

- find `void SandboxIPCHandler::Run()`
- find `if (failed_polls++ == 3)` block and comment it out:

```c
/*
if (failed_polls++ == 3) {
    LOG(FATAL) << "poll(2) failing. SandboxIPCHandler aborting.";
    return;
}
*/
```

### Build

Now let's build:

```bash
mkdir -p out/Headless
echo 'import("//build/args/headless.gn")' > out/Headless/args.gn
echo 'is_debug = false' >> out/Headless/args.gn
echo 'symbol_level = 0' >> out/Headless/args.gn
echo 'is_component_build = false' >> out/Headless/args.gn
echo 'remove_webcore_debug_symbols = true' >> out/Headless/args.gn
echo 'enable_nacl = false' >> out/Headless/args.gn
gn gen out/Headless
```

The following will take a while:

```bash
ninja -C out/Headless headless_shell
```

Make a tarball and download:

```bash
cd out
export VERSION=<put chrome version here>
tar -zcvf chrome-headless-aws-lambda-$VERSION-x64.tgz ./headless_shell

scp -i path/to/your/key-pair.pem ec2-user@<instance-hostname>:path/to/tarball ./
```

Stop your huge EC2 instance to avoid charges!

## NSS

Start a smallish EC2 instance using the same AMI as lambda. You can find a link to it [here][1]. Build on the instance using the following (adapted from instructions found [here][2]):

```shell
sudo yum install mercurial
sudo yum groupinstall 'Development Tools'
sudo yum install zlib-devel

hg clone https://hg.mozilla.org/projects/nspr
hg clone https://hg.mozilla.org/projects/nss

cd nss

export BUILD_OPT=1
export USE_64=1
export NSDISTMODE=copy

gmake nss_build_all
```

Remove any simlinks in the `dist` directory (they'll be links to .chk files) and tar it up for grabbing by scp.

You'll need to scp it to your lambda project, unpack it, and rename its directory to `nss`. In your handler, update the process environment (before chrome is started):

```javascript
const fs = require('fs');
const path = require('path');

// This file contains the name of a versioned folder. By doing it this way we
// can update the build without having to update hard-coded paths in Node.
const subPath = fs.readFileSync(path.join(__dirname, 'nss', 'latest'), 'utf8').trim();
const pathToNss = path.join(__dirname, 'nss', subPath);

process.env.LD_LIBRARY_PATH = path.join(pathToNss, 'lib') +  ':' + process.env.LD_LIBRARY_PATH;
process.env.PATH = path.join(pathToNss, 'bin') + ':' + process.env.PATH;
```

[1]: http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html
[2]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/Reference/Building_and_installing_NSS/Build_instructions
