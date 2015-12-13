package yikaig.service;

import java.awt.*;
import java.io.File;

import com.vividsolutions.jts.geom.*;
import org.geotools.data.DataUtilities;
import org.geotools.data.FileDataStore;
import org.geotools.data.FileDataStoreFinder;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureSource;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.filter.Filter;


/**
 * @author Yikai Gong
 */

public class GeoService{
//    private File file = null;
//    private FileDataStore store = null;
//    private SimpleFeatureSource vicRoadSource = null;
//    private SimpleFeatureCollection vicRoadsCollection = null;
//
//    private boolean isServiceReady = false;
//
//    public GeoService(){
//        file = new File("/home/darcular/Desktop/VicHealth/PSMA/PSMA_Street_Line_Vic/PSMA_Street_Line_Vic.shp");
//
//        try{
//            store = FileDataStoreFinder.getDataStore(file);
//            vicRoadSource = store.getFeatureSource();
//            vicRoadsCollection = vicRoadSource.getFeatures();
//            isServiceReady = true;
//        }catch (Exception e){
//            e.printStackTrace();
//        }
//    }
//
//    public boolean isOnStreet(SimpleFeature point){
//        if(isServiceReady){
////            (com.vividsolutions.jts.geom.Point)point.getDefaultGeometry()
//            Filter filter;
////            vicRoadSource.getFeatures(filter);
//
//        }
//        return false;
//    }

}
