## Build Your Chrome

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

```bash
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
echo "export PATH=$PATH:$HOME/depot_tools" >> ~/.bash_profile
source ~/.bash_profile
mkdir Chromium && cd Chromium
fetch --no-history chromium
cd src
```

Note: Chrome version is available in `./chrome/VERSION`.

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
