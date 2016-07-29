cmake_minimum_required(VERSION 2.8 FATAL_ERROR)

project(PartyZone)

#------------------------------------------------------------------------
# build defenitions (on top for fast access)
#------------------------------------------------------------------------
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug CACHE INTERNAL
      "Choose the type of build, options are: None Debug Release RelWithDebInfo MinSizeRel."
      FORCE)
endif(NOT CMAKE_BUILD_TYPE)


#------------------------------------------------------------------------
# library dependencies
#------------------------------------------------------------------------
## cmake module path (make sure to pull the cmake subrepository)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/cmake)


find_package(Glibmm 2.4 REQUIRED)
add_definitions(${GLIBMM_DEFINITIONS})

# GStreamer
find_package(GStreamer 1.0 REQUIRED)
add_definitions(${GSTREAMER_DEFINITIONS})

# Thrift
find_package(Thrift REQUIRED)

#------------------------------------------------------------------------
# include & link directories
#------------------------------------------------------------------------

#  THRIFT_COMPILER

## from library dependencies
include_directories(${GSTREAMER_INCLUDE_DIRS}
	            ${GTKMM_INCLUDE_DIRS}
                    ${GLIBMM_INCLUDE_DIRS}
                    ${THRIFT_INCLUDE_DIR}
)

link_directories( ${GSTREAMER_LIBRARY_DIRS}
                  ${GTKMM_LIBRARY_DIRS}
                  ${GLIBMM_LIBRARY_DIRS}
                  ${THRIFT_LIBRARIES}
)


## from this project
include_directories(
    "${PROJECT_SOURCE_DIR}/libs"   
    "${PROJECT_SOURCE_DIR}/include"   
    "${PROJECT_SOURCE_DIR}/src"       
)


#------------------------------------------------------------------------
# build
#------------------------------------------------------------------------
#set(HEADERS )

set(PACKAGE "PartyZone")
set(UNINSTALLED_DATA_DIR "${PROJECT_SOURCE_DIR}/data")
set(DATA_DIR "${CMAKE_INSTALL_PREFIX}/share")

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

configure_file(${CMAKE_CURRENT_SOURCE_DIR}/config.h.in  ${CMAKE_CURRENT_SOURCE_DIR}/include/config.h)
add_definitions("-D HAVE_CONFIG_H")

set(PLAYER_THRIFT_SRCS gen-cpp/player_types.cpp gen-cpp/Player.cpp gen-cpp/player_constants.cpp)

set(PLAYER_THRIFT_HEADERS gen-cpp/player_types.h gen-cpp/Player.h gen-cpp/player_constants.h)

add_custom_command(OUTPUT ${PLAYER_THRIFT_SRCS} ${PLAYER_THRIFT_HEADERS}
    COMMAND ${THRIFT_COMPILER} --gen cpp ${PROJECT_SOURCE_DIR}/src/player.thrift
)

add_executable(master_player src/master_player.cc ${PLAYER_THRIFT_SRCS})

message(STATUS ${GSTREAMER_LIBRARIES})

target_link_libraries(master_player ${GSTREAMER_LIBRARIES}
                                    ${GTKMM_LIBRARIES}
                                    ${GLIBMM_LIBRARIES}
                                    ${THRIFT_LIBRARIES}
)
