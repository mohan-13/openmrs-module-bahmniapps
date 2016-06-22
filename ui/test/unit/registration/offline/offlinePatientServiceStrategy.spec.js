'use strict';

describe('PatientServiceStrategy test', function () {
    var patientServiceStrategy, patientJson, patientAttributeTypes;
    var offlinePatientServiceStrategyMock, $q = Q, eventQueueMock, rootScope;

    eventQueueMock = jasmine.createSpyObj('eventQueue', ['addToEventQueue']);
    offlinePatientServiceStrategyMock = jasmine.createSpyObj(' offlinePatientServiceStrategy', ['search', 'get', 'create', 'deletePatientData','getAttributeTypes']);

    beforeEach(function () {
        module('bahmni.common.offline');
        module('bahmni.registration');
        module(function ($provide) {
            $provide.value('$q', $q);
            $provide.value('eventQueue', eventQueueMock);
            $provide.value('offlinePatientServiceStrategy', offlinePatientServiceStrategyMock);
        });
        jasmine.getFixtures().fixturesPath = 'base/test/data';
        patientJson = JSON.parse(readFixtures('patient.json'));
        patientAttributeTypes = JSON.parse(readFixtures('patientAttributeType.json'));
        offlinePatientServiceStrategyMock.getAttributeTypes.and.returnValue(specUtil.respondWith(patientAttributeTypes.data.results));
        offlinePatientServiceStrategyMock.get.and.returnValue(specUtil.respondWith(patientJson));
        offlinePatientServiceStrategyMock.create.and.returnValue(specUtil.respondWith({"data": patientJson}));
        offlinePatientServiceStrategyMock.deletePatientData.and.returnValue(specUtil.respondWith({}));
        eventQueueMock.addToEventQueue.and.returnValue(specUtil.respondWith({}));
    });

    beforeEach(inject(['patientServiceStrategy', "$rootScope", function (patientServiceStrategyInjected, rootScopeInjected) {
        patientServiceStrategy = patientServiceStrategyInjected;
        rootScope = rootScopeInjected;
    }]));

    it("should get patient data to render registration page", function (done) {
        patientServiceStrategy.get("e34992ca-894f-4344-b4b3-54a4aa1e5558").then(function (data) {
            expect(_.some(data.patient.person.attributes, function (attribute) {
                return attribute.attributeType.uuid === 'c1f4239f-3f10-11e4-adec-0800271c1b75' && attribute.value === 'hindu';
            })).toBeTruthy();
            expect(_.some(data.patient.person.attributes, function (attribute) {
                return attribute.attributeType.uuid === 'c1f455e7-3f10-11e4-adec-0800271c1b75' && attribute.value.display === 'General';
            })).toBeTruthy();
            expect(_.some(data.patient.person.attributes, function (attribute) {
                return attribute.attributeType.uuid === 'c1f4a004-3f10-11e4-adec-0800271c1b75' && attribute.value.display === '6th to 9th';
            })).toBeTruthy();
            expect(_.some(data.patient.person.attributes, function (attribute) {
                return attribute.attributeType.uuid === '3dfdc176-17fd-42b1-b5be-c7e25b78b602' && attribute.value === 23;
            })).toBeTruthy();
            expect(_.some(data.patient.person.attributes, function (attribute) {
                return attribute.attributeType.uuid === 'fb3c00b1-81c8-40fe-89e8-6b3344688a13' && attribute.value === "21";
            })).toBeTruthy();
            expect(_.some(data.patient.person.attributes, function (attribute) {
                return attribute.attributeType.uuid === '9234695b-0f68-4970-aeb7-3b32d4a2b346';
            })).toBeTruthy();
        }).catch(notifyError).finally(done);
    });

    it("should update the patient", function (done) {
        var patient = {
            "uuid": "e34992ca-894f-4344-b4b3-54a4aa1e5558",
            "identifierPrefix": {
                "prefix": "GAN"
            },
            "age": 42,
            "getImageData": function () {
                return;
            }
        };
        patientServiceStrategy.update(patient, patientJson.patient, patientAttributeTypes.data.results).then(function(data) {
            var event = {};
            event.url = Bahmni.Registration.Constants.baseOpenMRSRESTURL + "/bahmnicore/patientprofile/e34992ca-894f-4344-b4b3-54a4aa1e5558";
            event.patientUuid = "e34992ca-894f-4344-b4b3-54a4aa1e5558";
            expect(data.data.patient.identifiers[0].identifierSourceUuid).toBe("81f27b48-8792-11e5-ade6-005056b07f03");
            expect(eventQueueMock.addToEventQueue).toHaveBeenCalledWith(event);
        }).catch(notifyError).finally(done);
    });

    it("should create new patient ", function (done) {
        patientJson.patient.uuid = undefined;
        patientServiceStrategy.create(patientJson).then(function(data) {
            var url = Bahmni.Registration.Constants.baseOpenMRSRESTURL + "/bahmnicore/patientprofile/";
            expect(eventQueueMock.addToEventQueue).toHaveBeenCalledWith(jasmine.objectContaining({"url": url}));
        }).catch(notifyError).finally(done);

    });

    it("should create new patient with providerInfo as creator inside auditInfo", function (done) {
        patientJson.patient.uuid = undefined;
        var providerInfo = {uuid: 'c1c21e11-3f10-11e4-adec-0800271c1111', display: 'armanvuiyan', links: []};
        rootScope.currentProvider = providerInfo;
        patientServiceStrategy.create(patientJson).then(function(data) {
            var url = Bahmni.Registration.Constants.baseOpenMRSRESTURL + "/bahmnicore/patientprofile/";
            expect(eventQueueMock.addToEventQueue).toHaveBeenCalledWith(jasmine.objectContaining({"url": url}));
            expect(offlinePatientServiceStrategyMock.create).toHaveBeenCalledWith(patientJson);
            expect(data.data).toBe(patientJson);
            expect(data.data.patient.auditInfo.creator).toBe(providerInfo);
            expect(data.data.patient.auditInfo.creator).toBe(providerInfo);
        }).catch(notifyError).finally(done);
    });
});
