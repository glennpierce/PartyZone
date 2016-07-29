# - Try to find GTKmm
# Once done, this will define
#
#  GTKMM_FOUND - system has GTKmm
#  GTKMM_LIBRARIES - link these to use GTKmm
#  GTKMM_INCLUDE_DIRS - the GTKmm include directories
#  GTKMM_LIBRARY_DIRS - the GTKmm library directories
#
# Note: this does not work on Windows
#
# Copyright (c) 2013, Dirk Van Haerenborgh
#


include(LibFindMacros)

if(NOT DEFINED Glibmm_FIND_VERSION)
    set(Glibmm_FIND_VERSION "2.4")
endif(NOT DEFINED Glibmm_FIND_VERSION)



find_package(PkgConfig REQUIRED)

set(ENV{PKG_CONFIG_PATH} "${Glibmm_ROOT}/lib/pkgconfig:${Glibmm_ROOT}/lib64/pkgconfig")
pkg_check_modules(GLIBMM glibmm-${Glibmm_FIND_VERSION_MAJOR}.${Glibmm_FIND_VERSION_MINOR})

